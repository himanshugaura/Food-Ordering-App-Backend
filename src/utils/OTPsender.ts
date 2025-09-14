import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

export const sendSMS = async (phone: string, otp: string) => {
  const apiKey = process.env.SMS_API_KEY;
  const route = process.env.SMS_ROUTE || "otp"; 

  if (!apiKey) {
    throw new Error("SMS_API_KEY is missing in environment variables");
  }

  const smsUrl = "https://www.fast2sms.com/dev/bulkV2";

  try {
    const response = await axios.post(
      smsUrl,
      {
        variables_values: otp,
        route: route,
        numbers: phone,
      },
      {
        headers: {
          authorization: apiKey,
        },
      }
    );

    if (response.data.return === true) {
      return { success: true, data: response.data };
    } else {
      return {
        success: false,
        error: response.data.message?.[0] || "Unknown error",
      };
    }
  } catch (error: any) {
    console.error(
      "Fast2SMS Error:",
      error.response?.data || error.message
    );
    return {
      success: false,
      error: error.response?.data || "Failed to send OTP",
    };
  }
};
