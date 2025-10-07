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
    const token = data.token || data.accessToken || data.access_token;
    const expiresIn = data.expiresIn || data.expires_in || data.expires || null;
    if (!token) throw new Error('No token from PostcardMania auth');
    this.token = token;
    this.tokenExpiry = expiresIn ? Date.now() + Number(expiresIn) * 1000 : Date.now() + 3600 * 1000;
    this.client.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;
    this.client.defaults.headers.common['Content-Type'] = 'application/json';
    return this.token;
  }

  async ensureAuth() {
    if (!this.token || Date.now() >= this.tokenExpiry - 60000) await this.authenticate();
  }

  async getAllDesigns() {
    await this.ensureAuth();
    const r = await this.client.get('/design');
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

  async createOrder(orderData) {
    await this.ensureAuth();
    const r = await this.client.post('/order/postcard', orderData);
    return r.data;
  }

  async getOrderStatus(orderId) {
    await this.ensureAuth();
    const r = await this.client.get(`/orders/${orderId}`);
    return r.data;
  }

  formatOrderForPCM(order) {
    return {
      design_id: order.designId,
      design_type: order.designType,
      mail_class: order.mailClass,
      mail_date: order.mailDate,
      brochure_fold: order.brochureFold,
      return_address: order.returnAddress,
      recipients: (order.recipients || []).map(r => ({
        first_name: r.firstName,
        last_name: r.lastName,
        company: r.company,
        address1: r.address1,
        address2: r.address2,
        city: r.city,
        state: r.state,
        zip_code: r.zipCode,
        external_reference: r.externalReferenceNumber,
      })),
      external_reference: order.externalReference,
    };
  }
  formatDesignForLocal(design) {
    return {
      pcmDesignId: design.designID?.toString(),
      name: design.friendlyName || `Design ${design.designID}`,
      size: design.size?.label || "Unknown",
      previewUrl: design.proofFront || design.proofBack || design.proofPDF || null,
      rawData: design,
    };
  }

  // wrapper to send to printer (keeps compatibility)
  async sendToPrinter(order, adminUser) {
    const payload = this.formatOrderForPCM(order);
    return this.createOrder(payload);
  }
}

module.exports = new PostcardService();
