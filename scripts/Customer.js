var BallLayout = require('./BallLayout');
var ContactInfo = require('./ContactInfo');

const Handedness = {
    LEFT: "left",
    RIGHT: "right"
};

class Customer {
    constructor() {
        this.id = -1;
        this.notes = "";
        this.contactInfo = new ContactInfo();
        this.ballLayouts = [new BallLayout()];
        this.handedness = Handedness.RIGHT;
    }

    static buildCustomerFromDoc(doc) {
        let data = doc.data();
        let customer = new Customer();
        let contactInfo = JSON.parse(data.contactInfo);
        let ballLayouts = JSON.parse(data.layouts);

        customer.id = doc.id;
        customer.notes = data.notes;
        customer.contactInfo = contactInfo;
        customer.ballLayouts = ballLayouts;
        return customer;
    }
}

module.exports = Customer;
