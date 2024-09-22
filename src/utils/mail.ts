import nodemailer from "nodemailer";
import Mailgen from "mailgen";
import logger from "../logger/winston.logger";
import SMTPTransport from "nodemailer/lib/smtp-transport";
import { EMAIL, PASSWORD } from "../secrets";

export const sendMail = async (options: any) => {
  const mailGenerator = new Mailgen({
    theme: "default",
    product: {
      name: "Muta-Engine-Demo",
      link: "https://mutaengine.cloud/",
    },
  });
  //text email for thoose who donn not support html
  const emailTextual = mailGenerator.generatePlaintext(options.mailgenContent);

  // Generate an HTML email with the provided contents
  const emailHtml = mailGenerator.generate(options.mailgenContent);
  const transporter = nodemailer.createTransport({
    host: `smtp.gmail.com`,
    port: 465,
    auth: {
      user: EMAIL,
      pass: PASSWORD,
    },
  } as SMTPTransport.Options);
  const mail = {
    from: EMAIL, // We can name this anything.
    to: options.email, // receiver's mail
    subject: options.subject,
    text: emailTextual,
    html: emailHtml,
  };
  try {
    await transporter.sendMail(mail);
  } catch (error) {
    // As sending email is not strongly coupled to the business logic it is not worth to raise an error when email sending fails
    // So it's better to fail silently rather than breaking the app
    logger.error(
      "Email service failed silently. Make sure you have provided your MAILTRAP credentials in the .env file"
    );
    logger.error("Error: ", error);
  }
};

export const forgotPasswordMailgenContent = (
  username: string,
  passwordResetUrl: string
) => {
  return {
    body: {
      name: username,
      intro: "We got a request to reset the password of our account",
      action: {
        instructions:
          "To reset your password click on the following button or link:",
        button: {
          color: "#8F00FF", // Optional action button color
          text: "Reset password",
          link: passwordResetUrl,
        },
      },
      outro:
        "Need help, or have questions? Just reply to this email, we'd love to help.",
    },
  };
};
export const orderConfirmationMailgenContent = (
  username: string,
  items: any,
  totalCost: number
) => {
  console.log("i am here ");
  return {
    body: {
      name: username,
      intro: "Your order has been processed successfully.",
      table: {
        data: items?.map((item: any) => {
          return {
            item: item.product?.name,
            price: "INR " + item.product?.price + "/-",
            quantity: item.quantity,
          };
        }),
        columns: {
          // Optionally, customize the column widths
          customWidth: {
            item: "20%",
            price: "15%",
            quantity: "15%",
          },
          // Optionally, change column text alignment
          customAlignment: {
            price: "right",
            quantity: "right",
          },
        },
      },
      outro: [
        `Total order cost: INR ${totalCost}/-`,
        "You can check the status of your order and more in your order history",
      ],
    },
  };
};
