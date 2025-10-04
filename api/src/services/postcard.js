const axios = require('axios');

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
    const r = await this.client.get('/designs');
    return r.data;
  }

  async getDesignById(id) {
    await this.ensureAuth();
    const r = await this.client.get(`/designs/${id}`);
    return r.data;
  }

  async createNewDesign(designData) {
    await this.ensureAuth();
    const r = await this.client.post('/designs', designData);
    return r.data;
  }

  async openDesignEditor(designId) {
    await this.ensureAuth();
    const r = await this.client.post(`/designs/${designId}/editor`);
    return r.data;
  }

  async createOrder(orderData) {
    await this.ensureAuth();
    const r = await this.client.post('/orders', orderData);
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
      pcmDesignId: design.id,
      name: design.name,
      size: design.size,
      previewUrl: design.preview_url,
      isPublic: false,
    };
  }

  // wrapper to send to printer (keeps compatibility)
  async sendToPrinter(order, adminUser) {
    const payload = this.formatOrderForPCM(order);
    return this.createOrder(payload);
  }
}

module.exports = new PostcardService();
