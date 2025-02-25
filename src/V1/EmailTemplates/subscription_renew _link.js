export const subscriptionReNewLink = async (data) => {
  let result = `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta http-equiv="X-UA-Compatible" content="IE=edge" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Document</title>
      <link href="https://fonts.googleapis.com/css2?family=Rubik:ital,wght@0,300;0,400;0,500;1,300;1,400&display=swap"
        rel="stylesheet" />
      <style>
        * {
          font-family: "Inter", "Roboto", "Helvetica", Arial, sans-serif;
        }
      </style>
    </head>
    <body style="background-color: #F7F9FB;">
      <div style="background-color: #F7F9FB;" >
        <table id="email" style="
              width: 100%;
              max-width: 700px;
              margin: 0px auto;
              /* background-color: #F7F9FB; */
              text-align: center;
              padding: 40px 10px;
              position: relative;
              border-spacing: 0px;
            ">
          <tr>
            <td>
              <div style="display: flex; align-items: center; gap: 10px; justify-content: center;">`;
                result +=`<img class= "logo" src="${process.env.BASE_IMAGE_URL}email-templates-images/icons8-technical_support%2B2.png" alt="logo" />`;
                result +=` <div style="display: block; text-align: left;">
                  <span style="margin: 0px; font-size: 32px; font-weight: 300;">Remote<span>
                  <h1 style="margin-top: 5px; margin-bottom: 0px; font-size: 36px; font-weight: 700;">CoWorker</h1>
                </div>
              </div>
            </td>
          </tr>
          <tr>
            <td>
              <table style="
                    box-shadow: 0px 4px 44px 0px #d6d7e333;
                    background-color: #fff;
                    padding: 58px 30px;
                    position: relative;
                    margin: 40px auto 0px;
                    max-width: 700px;
                    border-radius: 10px;
                    /* padding: 0 50px; */
                  ">
                <tr>
                  <td>
                    <p style="
                          font-style: normal;
                          font-weight: 700;
                          font-size: 34px;
                          line-height: 41.15px;
                          text-align: center;
                          color: #111827;
                          margin: 0px;
                        ">
                        Renew Your Subscription
                    </p>
                    <p style="
                          font-style: normal;
                          font-weight: 400;
                          font-size: 20px;
                          line-height: 24.2px;
                          text-align: left;
                          color: #757982;
                          margin-top: 10px;
                          margin-bottom: 0px;
                        ">
                        Dear ${data.first_name} ${data.last_name},
                    </p>
                    <p style="
                         font-style: normal;
                      font-weight: 400;
                      font-size: 20px;
                      line-height: 24.2px;
                      text-align: left;
                      color: #757982;
                      margin-top: 10px;
                      margin-bottom: 0px;
                        ">
                       We hope you're enjoying our services! To continue accessing premium features without interruption, please renew your subscription by completing your payment.

                    </p>

                  <p style="
                      font-style: normal;
                      font-weight: 400;
                      font-size: 20px;
                      line-height: 24.2px;
                      text-align: center;
                      color: #757982;
                      width: 70%;
                      margin: 10px auto 0px;
                      ">

                      <tr>
                        <td>
                          <p
                            class="otp"
                            style="
                              background: #ededfc;
                              border: 0.3px solid #d6d7e3;
                              border-radius: 8px;
                              padding: 52px 41px;
                              text-align: center;
                              font-weight: 800;
                              font-size: 24px;
                              line-height: 29px;
                              color: #4f46e5;
                              margin: 67px auto 71px;
                            "
                          >
                            <span
                              style="font-size: 22px; color: #111827; font-weight: 500;"
                            >
                              Here is Payment link
                            </span>
                            <br />
                            <a
                              href="${data.payment_link}"
                              style="
                                display: inline-block;
                                text-align: center;
                                font-weight: 800;
                                font-size: 22px;
                                line-height: 28px;
                                color: #4f46e5;
                                margin-top: 20px;
                                text-decoration: underline;
                              "
                            >
                            
                            Pay Here
                            </a>
                            <br />
                          </p>
                        </td>
                      </tr>
                      <tr>
                    
                  </p>
                  </td>
                </tr>
                <tr>
                  <td>
                    <p style="
                          font-style: normal;
                          font-weight: 400;
                          font-size: 20px;
                          line-height: 24.2px;
                          text-align: left;
                          color: #757982;
                          margin-top: 10px;
                          margin-bottom: 0px;
                      ">
                        Thank you for choosing <b>RCW!</b> We look forward to serving you.
                    </p>
                    <p style="
                          font-style: normal;
                          font-weight: 400;
                          font-size: 20px;
                          line-height: 24.2px;
                          text-align: left;
                          color: #757982;
                          margin-top: 10px;
                          margin-bottom: 0px;
                      ">
                        Best regards,
                    </p>
                    <p style="
                          font-style: normal;
                          font-weight: 400;
                          font-size: 20px;
                          line-height: 24.2px;
                          text-align: left;
                          color: #757982;
                          margin-top: 10px;
                          margin-bottom: 0px;
                      ">
                        <b>RCW Team</b>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <tr style="line-height: 0px;border-spacing: 0px;">
            <td style="padding-top: 0px;border-left: 32px solid transparent;border-right: 32px solid transparent;">
            </td>
          </tr>
        </table>
      </div>
    </body>
    </html>`
  return result;
}

