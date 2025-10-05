const svc = require('./api/src/services/postcardManiaService');

const sample = {
    designID: 17407,
    size: { key: '46', label: '4.25 x 6' },
    proofFront: null,
    proofBack: null,
    proofPDF: null,
    friendlyName: 'string',
    approvalDateTime: '2022-12-29T00:00:00.000Z',
    designFields: [],
    mailClasses: ['FirstClass'],
    productType: 'postcard',
    qrCodeID: null,
    isUpload: false
};

console.log('Formatted: ', svc.formatDesignForLocal(sample));
