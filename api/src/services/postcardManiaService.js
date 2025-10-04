const axios = require("axios");

class PostcardManiaService {
  constructor() {
    this.baseURL =
      process.env.POSTCARD_MANIA_API_URL || "https://api.postcardmania.com";
    this.apiKey = process.env.POSTCARD_MANIA_API_KEY;
    this.apiSecret = process.env.POSTCARD_MANIA_API_SECRET;
    this.client = axios.create({ baseURL: this.baseURL });

    // token cache
    this.token = null;
    this.tokenExpiry = 0; // ms since epoch
  }

  // Authenticate and cache token
  async authenticate() {
    if (this.token && Date.now() < this.tokenExpiry - 60000) {
      // token still valid (with 60s buffer)
      return this.token;
    }

    if (!this.apiKey || !this.apiSecret) {
      throw new Error("PostcardMania API credentials not configured (POSTCARD_MANIA_API_KEY / POSTCARD_MANIA_API_SECRET)");
    }

    try {
      const resp = await this.client.post("/auth/login", {
        apiKey: this.apiKey,
        apiSecret: this.apiSecret,
      });

      const data = resp.data || {};
      // try common token fields
      const token = data.token || data.accessToken || data.access_token;
      const expiresIn = data.expiresIn || data.expires_in || data.expires || null;

      if (!token) {
        throw new Error("PostcardMania auth response did not contain a token");
      }

      this.token = token;
      if (expiresIn) {
        this.tokenExpiry = Date.now() + Number(expiresIn) * 1000;
      } else {
        // Default to 1 hour if no expiry provided
        this.tokenExpiry = Date.now() + 60 * 60 * 1000;
      }

      // set Authorization header for subsequent requests
      this.client.defaults.headers.common["Authorization"] = `Bearer ${this.token}`;
      this.client.defaults.headers.common["Content-Type"] = "application/json";

      return this.token;
    } catch (err) {
      console.error("PostcardMania authentication failed:", err?.response?.data || err.message || err);
      throw err;
    }
  }

  async ensureAuth() {
    if (!this.token || Date.now() >= this.tokenExpiry - 60000) {
      await this.authenticate();
    }
  }

  // Design Management APIs
  async getAllDesigns() {
    try {
      await this.ensureAuth();
      const response = await this.client.get("/designs");
      return response.data;
    } catch (error) {
      console.error("Error fetching designs from PostcardMania:", error?.response?.data || error.message || error);
      throw new Error("Failed to fetch designs from PostcardMania");
    }
  }

  async getDesignById(designId) {
    try {
      await this.ensureAuth();
      const response = await this.client.get(`/designs/${designId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching design ${designId}:`, error?.response?.data || error.message || error);
      throw new Error(`Failed to fetch design ${designId}`);
    }
  }

  async createNewDesign(designData) {
    try {
      await this.ensureAuth();
      const response = await this.client.post("/designs", designData);
      return response.data;
    } catch (error) {
      console.error("Error creating new design:", error?.response?.data || error.message || error);
      throw new Error("Failed to create new design");
    }
  }

  async openDesignEditor(designId) {
    try {
      await this.ensureAuth();
      const response = await this.client.post(`/designs/${designId}/editor`);
      return response.data;
    } catch (error) {
      console.error(`Error opening design editor for ${designId}:`, error?.response?.data || error.message || error);
      throw new Error(`Failed to open design editor for ${designId}`);
    }
  }

  // Order Management APIs
  async createOrder(orderData) {
    try {
      await this.ensureAuth();
      const response = await this.client.post("/orders", orderData);
      return response.data;
    } catch (error) {
      console.error("Error creating order in PostcardMania:", error?.response?.data || error.message || error);
      throw new Error("Failed to create order in PostcardMania");
    }
  }

  async getOrderStatus(orderId) {
    try {
      await this.ensureAuth();
      const response = await this.client.get(`/orders/${orderId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching order status for ${orderId}:`, error?.response?.data || error.message || error);
      throw new Error(`Failed to fetch order status for ${orderId}`);
    }
  }

  // Utility method to format order data for PostcardMania API
  formatOrderForPCM(order) {
    return {
      design_id: order.designId,
      design_type: order.designType,
      mail_class: order.mailClass,
      mail_date: order.mailDate,
      brochure_fold: order.brochureFold,
      return_address: order.returnAddress,
      recipients: (order.recipients || []).map((recipient) => ({
        first_name: recipient.firstName,
        last_name: recipient.lastName,
        company: recipient.company,
        address1: recipient.address1,
        address2: recipient.address2,
        city: recipient.city,
        state: recipient.state,
        zip_code: recipient.zipCode,
        external_reference: recipient.externalReferenceNumber,
      })),
      external_reference: order.externalReference,
    };
  }

  // Utility method to format design data for local storage
  formatDesignForLocal(design) {
    return {
      pcmDesignId: design.id,
      name: design.name,
      size: design.size,
      previewUrl: design.preview_url,
      isPublic: false, // Admin will set this
    };
  }
}

module.exports = new PostcardManiaService();
