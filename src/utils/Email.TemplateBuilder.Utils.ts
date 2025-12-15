export type InvoiceItem = {
  product: string;
  quantity: number;
  price: number;
};

export type CustomerInfo = {
  name: string;
  email: string;
  phone: string;
};

export type AddressInfo = {
  street: string;
  city: string;
  state: string;
  country: string;
  zipcode: string;
};

export type InvoiceEmailArgs = {
  status: 'Paid' | 'Pending' | 'Unpaid';
  invoiceNumber: string;
  orderNumber: string;
  date: string;
  paymentMethod: string;
  customer: CustomerInfo;
  address: AddressInfo;
  items: InvoiceItem[];
};

export class InvoiceEmailTemplate {
  static build(args: InvoiceEmailArgs): string {
    const total = args.items.reduce((sum, item) => sum + item.quantity * item.price, 0);

    const rows = args.items
      .map(
        (item) => `
          <tr>
            <td>${item.product}</td>
            <td style="text-align:center;">${item.quantity}</td>
         <td style="text-align:right;">
  $${item.price ? Number(item.price).toFixed(2) : '0.00'}
</td>

          </tr>
        `,
      )
      .join('');

    return `
<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>Invoice</title>
<style>
  body {
    font-family: Arial, sans-serif;
    background: #f4f6f8;
    padding: 20px;
  }
  .container {
    max-width: 700px;
    margin: auto;
    background: #fff;
    padding: 24px;
    border: 1px solid #ddd;
  }
  .header {
    text-align: center;
    font-size: 20px;
    font-weight: bold;
    color: #007a87;
    margin-bottom: 20px;
  }
  .meta {
    text-align: right;
    font-size: 14px;
  }
  .section {
    margin-top: 20px;
    font-size: 14px;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 15px;
  }
  th {
    background: #003b73;
    color: #fff;
    padding: 10px;
    text-align: left;
  }
  td {
    border: 1px solid #ccc;
    padding: 10px;
  }
  .total {
    text-align: right;
    font-weight: bold;
    margin-top: 10px;
  }
  .footer {
    font-size: 12px;
    color: #666;
    margin-top: 30px;
  }
</style>
</head>

<body>
  <div class="container">
    <div class="header">New Order Has Been Received</div>

    <div class="meta">
      <div>Status: <strong>${args.status}</strong></div>
      <div><strong>Invoice</strong></div>
      <div>Order #: ${args.orderNumber}</div>
      <div>Date: ${args.date}</div>
    </div>

    <div class="section">
      <strong>Invoice To:</strong><br/>
      Name: ${args.customer.name}<br/>
      Email: ${args.customer.email}<br/>
      Phone: ${args.customer.phone}
    </div>

    <table>
      <thead>
        <tr>
          <th>Product</th>
          <th style="text-align:center;">Quantity</th>
          <th style="text-align:right;">Price</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
        <tr>
          <td colspan="2" style="text-align:right;"><strong>Total</strong></td>
          <td style="text-align:right;"><strong>$${total.toFixed(2)}</strong></td>
        </tr>
      </tbody>
    </table>

    <div class="total">Total Price: $${total.toFixed(2)}</div>

    <div class="section">
      <strong>Payment Method:</strong> ${args.paymentMethod}
    </div>

    <div class="section">
      <strong>Customer Address:</strong><br/>
      Street Address: ${args.address.street}<br/>
      City: ${args.address.city}<br/>
      State: ${args.address.state}<br/>
      Country: ${args.address.country}<br/>
      Zipcode: ${args.address.zipcode}
    </div>

    <div class="footer">
      I, <strong>${args.customer.name}</strong>, hereby acknowledge that I have read, understood, and agree to the Terms & Conditions, Privacy Policy, and Refund Policy.
    </div>
  </div>
</body>
</html>
    `;
  }
}
