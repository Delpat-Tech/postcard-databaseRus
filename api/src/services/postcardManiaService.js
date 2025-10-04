const axios = require("axios");

class PostcardManiaService {
  constructor() {
    this.baseURL =
      process.env.POSTCARD_MANIA_API_URL || "https://api.postcardmania.com";
    this.apiKey = process.env.POSTCARD_MANIA_API_KEY;
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
    });
  }

  // Design Management APIs
  async getAllDesigns() {
    try {
      const response = await this.client.get("/designs");
      return response.data;
    } catch (error) {
      console.error("Error fetching designs from PostcardMania:", error);
      throw new Error("Failed to fetch designs from PostcardMania");
    }
  }

  async getDesignById(designId) {
    try {
      const response = await this.client.get(`/designs/${designId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching design ${designId}:`, error);
      throw new Error(`Failed to fetch design ${designId}`);
    }
  }

  async createNewDesign(designData) {
    try {
      const response = await this.client.post("/designs", designData);
      return response.data;
    } catch (error) {
      console.error("Error creating new design:", error);
      throw new Error("Failed to create new design");
    }
  }

  async openDesignEditor(designId) {
    try {
      const response = await this.client.post(`/designs/${designId}/editor`);
      return response.data;
    } catch (error) {
      console.error(`Error opening design editor for ${designId}:`, error);
      throw new Error(`Failed to open design editor for ${designId}`);
    }
  }

  // Order Management APIs
  async createOrder(orderData) {
    try {
      const response = await this.client.post("/orders", orderData);
      return response.data;
    } catch (error) {
      console.error("Error creating order in PostcardMania:", error);
      throw new Error("Failed to create order in PostcardMania");
    }
  }

  async getOrderStatus(orderId) {
    try {
      const response = await this.client.get(`/orders/${orderId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching order status for ${orderId}:`, error);
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
      recipients: order.recipients.map((recipient) => ({
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
