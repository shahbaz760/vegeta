export const docusignForAgent = async (agentDetail) => {
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
        <p>${agentDetail.address}</p>
    </div>

    <h2 style="text-align: center; color: #000000;">Following are the terms and conditions of the contract</h2>
    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">`;
    
    result += `<div style="margin-top: 40px;">
        <p style="margin: 10px 0; text-align: justify;">${agentDetail.company_name}</p>
        <span style="display: block; margin-bottom: 20px;">By ${agentDetail.first_name+' '+agentDetail.last_name}</span>
        <span style="display: block; margin-bottom: 20px;">Signature: ______________________</span>
    </div>
</body>
</html>`;
return result;
}
