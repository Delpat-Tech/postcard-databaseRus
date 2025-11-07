const axios = require('axios');
const Template = require("../models/Template");

class PostcardService {
    constructor() {
        this.baseURL = process.env.POSTCARD_MANIA_API_URL || 'https://api.postcardmania.com';
        this.apiKey = process.env.POSTCARD_MANIA_API_KEY;
        this.apiSecret = process.env.POSTCARD_MANIA_API_SECRET;
        this.client = axios.create({ baseURL: this.baseURL });
        this.token = null;
        this.tokenExpiry = 0;
    }

    async authenticate() {
        if (this.token && Date.now() < this.tokenExpiry - 60000) return this.token;
        if (!this.apiKey || !this.apiSecret) throw new Error('PostcardMania credentials missing');
        const resp = await this.client.post('/auth/login', { apiKey: this.apiKey, apiSecret: this.apiSecret });
        const data = resp.data || {};
        const token = data.token;
        if (!token) throw new Error('No token from PostcardMania auth');
        this.token = token;
        this.tokenExpiry = data.expires;
        this.client.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;
        this.client.defaults.headers.common['Content-Type'] = 'application/json';
        return this.token;
    }

    async ensureAuth() {
        await this.authenticate();
    }

    async getAllDesigns(productType) {
        await this.ensureAuth();
        const r = await this.client.get('/design?productType=' + productType + '&perPage=1000');
        return r.data;
    }

    async getDesignById(id) {
        await this.ensureAuth();
        const r = await this.client.get(`/design/${id}`);
        return r.data;
    }

    async createNewDesign(designData) {
        await this.ensureAuth();
        const r = await this.client.post('/design/custom', designData);
        return r.data;
    }

    async openDesignEditor(designId) {
        try {
            await this.ensureAuth();
            console.log(`/design/${designId}/edit`);

            const r = await this.client.get(`/design/${designId}/edit?duplicate=true&mode=embed`);
            const newdesign = await this.getDesignById(r.data.designID); // fixed
            const template = new Template(this.formatDesignForLocal(newdesign)); // fixed
            template.isPublic = true;
            let savedtemplate = await template.save();
            savedtemplate = savedtemplate.toObject(); // convert Mongoose doc to plain object
            savedtemplate.url = r.data.url;
            return savedtemplate;

        } catch (error) {
            console.error(`Failed to open design editor for designId ${designId}:`, error);
            throw error;
        }
    }
    async openDesignMeEditor(designId) {
        try {
            await this.ensureAuth();
            console.log(`/design/${designId}/edit`);
            const r = await this.client.get(`/design/${designId}/edit?mode=embed`);
            return r.data
        } catch (error) {
            console.error(`Failed to open design editor for designId ${designId}:`, error);
            throw error;
        }
    }

    async createOrderpostcard(orderData) {
        await this.ensureAuth();
        const r = await this.client.post('/order/postcard', orderData);
        return r.data;
    }
    async createOrderletter(orderData) {
        await this.ensureAuth();
        const r = await this.client.post('/order/letter', orderData);
        return r.data;
    }

    async getOrderStatus(orderId) {
        await this.ensureAuth();
        const r = await this.client.get(`/orders/${orderId}`);
        return r.data;
    }

    async generateProof(format = "jpg", templateId, front, back, size, recipient) {
        try {
            await this.ensureAuth();

            if (!recipient) throw new Error("No recipient found for proof generation");
            if (!size) throw new Error("Size is required for proof generation");
            if (!templateId && !(front && back)) {
                throw new Error("You must provide either templateId or front+back for proof generation");
            }

            let proofPayload = {
                size,
                format,
                addressing: {
                    font: "Bradley Hand",
                    fontColor: "Black",
                    exceptionalAddressingType: "resident",
                },
            };

            try {
                if (templateId) {
                    let template = await Template.findById(templateId);
                    if (!template) throw new Error("Template not found");
                    proofPayload.designID = Number(template.pcmDesignId);
                } else {
                    proofPayload.front = front;
                    proofPayload.back = back;
                }
            } catch (templateError) {
                console.error("Error fetching template:", templateError);
                throw new Error("Failed to fetch template for proof generation");
            }

            try {
                proofPayload.returnAddress = recipient.returnAddress || null;
                // Normalize recipient variables: accept [{key,value}] or [{name,value}] and forward
                const rawVars = recipient.variables || [];
                const normalizedVars = (rawVars || []).map((v) => {
                    if (v == null) return null;
                    // support both { key, value } and { name, value }
                    const key = v.key || v.name || v.variableKey || null;
                    const value = v.value ?? v.variableValue ?? v.val ?? null;
                    return key ? { key, value } : { key: String(Object.keys(v)[0] || ""), value: String(Object.values(v)[0] || "") };
                }).filter(Boolean);

                proofPayload.recipient = recipient.recipient || {
                    company: recipient.company || "",
                    firstName: recipient.firstName,
                    lastName: recipient.lastName,
                    address: recipient.address1,
                    address2: recipient.address2 || " ",
                    city: recipient.city,
                    state: recipient.state,
                    zipCode: recipient.zipCode,
                    variables: normalizedVars,
                };
                // Also attach a variables_map for convenience (key->value) in case PCM integration prefers a map
                proofPayload.recipient.variables_map = normalizedVars.reduce((acc, v) => {
                    acc[v.key] = v.value;
                    return acc;
                }, {});
            } catch (recipientError) {
                console.error("Error preparing recipient data:", recipientError);
                throw new Error("Failed to prepare recipient for proof generation");
            }

            try {
                const response = await this.client.post(
                    "/design/generate-proof/postcard",
                    proofPayload
                );
                return response.data; // { front, back }
            } catch (apiError) {
                // Log full payload and API error for easier debugging
                console.error("Error generating proof from API. Payload:", JSON.stringify(proofPayload));
                console.error("PostcardMania error:", apiError?.response?.data || apiError?.message || apiError);
                // Include recipient id if available to help trace issues
                const recipientId = (recipient && (recipient.id || recipient.externalReferenceNumber)) || null;
                throw new Error(`Failed to generate proof from PostcardMania API${recipientId ? ` for recipient ${recipientId}` : ""}: ${apiError?.response?.data?.message || apiError?.message || "Unknown error"}`);
            }

        } catch (error) {
            console.error("generateProof error:", error);
            throw error; // Let the caller handle/display the error
        }
    }

    async generateProofletter(templateId, letter, envelope, color, recipient) {
        try {
            await this.ensureAuth();

            if (!recipient) throw new Error("No recipient found for proof generation");
            if (!envelope) throw new Error("Envelope details is required for proof generation");
            if (!templateId && !letter) {
                throw new Error("You must provide either templateId or letter for proof generation");
            }

            // Build initial payload. We'll normalize `letter` below (accept URL/pdf/html/object)
            let proofPayload = {
                color: !!color,
                envelope: envelope || {},
            };

            try {
                if (templateId) {
                    let template = await Template.findById(templateId);
                    if (!template) throw new Error("Template not found");
                    proofPayload.designID = Number(template.pcmDesignId);
                } else {
                    // Normalize letter input:
                    // - if it's an object, pass through
                    // - if it's a string URL (http/https) and looks like a PDF -> { pdf_url }
                    // - if it's a string that looks like HTML (starts with '<') -> { html }
                    // - otherwise send as raw string in `letter`

                    proofPayload.letter = letter;

                }
            } catch (templateError) {
                console.error("Error fetching template:", templateError?.message);
                throw new Error("Failed to fetch template for proof generation");
            }
            try {
                proofPayload.returnAddress = recipient.returnAddress || null;
                const rawVars = recipient.variables || [];
                const normalizedVars = (rawVars || []).map((v) => {
                    if (v == null) return null;
                    const key = v.key || v.name || v.variableKey || null;
                    const value = v.value ?? v.variableValue ?? v.val ?? null;
                    return key ? { key, value } : { key: String(Object.keys(v)[0] || ""), value: String(Object.values(v)[0] || "") };
                }).filter(Boolean);

                proofPayload.recipient = recipient.recipient || {
                    company: recipient.company || "",
                    firstName: recipient.firstName,
                    lastName: recipient.lastName,
                    address: recipient.address1,
                    address2: recipient.address2 || " ",
                    city: recipient.city,
                    state: recipient.state,
                    zipCode: recipient.zipCode,
                    variables: normalizedVars,
                };
                proofPayload.recipient.variables_map = normalizedVars.reduce((acc, v) => {
                    acc[v.key] = v.value;
                    return acc;
                }, {});
            } catch (recipientError) {
                console.error("Error preparing recipient data:", recipientError?.message);
                throw new Error("Failed to prepare recipient for proof generation");
            }

            console.log(proofPayload);
            try {
                const response = await this.client.post(
                    "/design/generate-proof/letter",
                    proofPayload
                );
                return response.data; // { front, back }
            } catch (apiError) {
                console.log("Error generating proof from API:", apiError?.message);
                throw new Error("Failed to generate proof from PostcardMania API");
            }

        } catch (error) {
            console.error("generateProof error:", error?.message);
            throw error; // Let the caller handle/display the error
        }
    }

    formatOrderForPCMpostcard(order) {
        return {
            mailClass: order.mailClass,
            recipients: (order.recipients || []).map(r => {
                // merge global design variables into recipient variables, with recipient overrides winning
                const globalVars = order.globalDesignVariables || [];
                const recipientVars = r.variables || [];
                const mergedMap = {};
                (globalVars || []).forEach(v => { if (v && v.key) mergedMap[v.key] = v.value; });
                (recipientVars || []).forEach(v => { if (v && v.key) mergedMap[v.key] = v.value; });
                const mergedArray = Object.keys(mergedMap).map(k => ({ key: k, value: mergedMap[k] }));

                return {
                    firstName: r.firstName,
                    lastName: r.lastName,
                    company: r.company,
                    address: r.address1,
                    address2: r.address2,
                    city: r.city,
                    state: r.state,
                    zipCode: r.zipCode,
                    external_reference: r.externalReferenceNumber,
                    variables: mergedArray,
                    variables_map: mergedMap,
                };
            }),
            mailDate: order.mailDate,
            returnAddress: order.returnAddress,
            ...(order.front && order.back
                ? {
                    front: order.front,
                    back: order.back,
                    size: order.designSize,
                }
                : {
                    designID: Number(order.designId)
                }),
        };
    }

    formatOrderForPCMletter(order) {
        return {
            mailClass: order.mailClass,
            recipients: (order.recipients || []).map(r => {
                const globalVars = order.globalDesignVariables || [];
                const recipientVars = r.variables || [];
                const mergedMap = {};
                (globalVars || []).forEach(v => { if (v && v.key) mergedMap[v.key] = v.value; });
                (recipientVars || []).forEach(v => { if (v && v.key) mergedMap[v.key] = v.value; });
                const mergedArray = Object.keys(mergedMap).map(k => ({ key: k, value: mergedMap[k] }));

                return {
                    firstName: r.firstName,
                    lastName: r.lastName,
                    company: r.company,
                    address: r.address1,
                    address2: r.address2,
                    city: r.city,
                    state: r.state,
                    zipCode: r.zipCode,
                    external_reference: r.externalReferenceNumber,
                    variables: mergedArray,
                    variables_map: mergedMap,
                };
            }),
            mailDate: order.mailDate,
            returnAddress: order.returnAddress,
            ...(order.front && order.back
                ? {
                    letter: order.front,
                    back: order.back,
                }
                : {
                    designID: order.designId,
                }),
            insertAddressingPage: order.insertAddressingPage,
            printOnBothSides: order.printOnBothSides,
            color: order.color,
            envelope: {
                font: order.font,
                type: order.envelopeType,
                fontColor: order.fontColor,
            },
        };
    }
    formatDesignForLocal(design) {
        return {
            pcmDesignId: design.designID?.toString(),
            name: design.friendlyName || `Design ${design.designID}`,
            size: design.size?.label || "Unknown",
            previewUrl: design.proofFront || design.proofBack || design.proofPDF || null,
            rawData: design,
            type: design.productType || "postcard",
        };
    }

    // Delete a design in PostcardMania by design ID
    // Note: assumes PostcardMania exposes DELETE /design/:id — if API differs adjust accordingly.
    async deleteDesign(designId) {
        try {
            await this.ensureAuth();
            const r = await this.client.delete(`/design/${designId}`);
            return r.data;
        } catch (error) {
            console.error(`Failed to delete design ${designId}:`, error?.response?.data || error.message || error);
            throw new Error(`Failed to delete design ${designId} from PostcardMania`);
        }
    }

    // wrapper to send to printer (keeps compatibility)
    async sendToPrinter(order, adminUser) {
        const payload = this.formatOrderForPCM(order);
        return this.createOrder(payload);
    }
}

module.exports = new PostcardService();
