export const docusign = async (clientDetail, subscriptionData) => {
let result = `<!DOCTYPE html>
<html>
<head>
    <title>RCW Contract</title>
</head>
<body style="font-family: 'Times New Roman', Times, serif; margin: 40px; color: #333;">
    <div style="text-align: center; margin-bottom: 40px;">
        <h1 style="color: #000000;">RCW Contract</h1>
        <p>This is a formal contract between a company Remote CoWorker Inc.</p>
        <p>7901 4th Street N, Suite 300 St. Petersburg, FL 33702</p>
        <p>and</p>
        <p>${clientDetail.company_name}</p>
        <p>${clientDetail.address}</p>
    </div>

    <h2 style="text-align: center; color: #000000;">Following are the terms and conditions of the contract</h2>
    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">`;
    
    for(let i in subscriptionData) {

    result += `<tr>
            <th style="border: 1px solid #000; padding: 15px; background-color: #f2f2f2;">${subscriptionData[i].name}</th>
            <th style="border: 1px solid #000; padding: 15px; background-color: #f2f2f2;">${subscriptionData[i].description}</th>
            <th style="border: 1px solid #000; padding: 15px; background-color: #f2f2f2;">${subscriptionData[i].quantity}</th>
            <th style="border: 1px solid #000; padding: 15px; background-color: #f2f2f2;">${subscriptionData[i].billing_frequency}</th>
        </tr>`;
    }
    result += `</table>
    <p style="margin: 10px 0; text-align: justify;">Total Paid: ${clientDetail.total_amount}</p>

    <div style="margin-top: 40px;">
        <p style="margin: 10px 0; text-align: justify;">${clientDetail.company_name}</p>
        <span style="display: block; margin-bottom: 20px;">By ${clientDetail.client_name}</span>
        <span style="display: block; margin-bottom: 20px;">Signature: ______________________</span>
    </div>
</body>
</html>`;
return result;
}
