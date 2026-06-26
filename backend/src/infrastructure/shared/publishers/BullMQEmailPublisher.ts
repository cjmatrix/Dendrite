import { IEmailPublisher } from "../../../application/common/ports/IEmailPublisher";
import { addEmailJob } from "../../queue/emailQueue";
import { injectable } from "tsyringe";

@injectable()
export class BullMQEmailPublisher implements IEmailPublisher {
  async publishOTP(email: string, otp: string): Promise<string | undefined> {
    return addEmailJob("otp", { email, otp });
  }

  async publishPasswordReset(email: string, token: string): Promise<string | undefined> {
    return addEmailJob("password-reset", { email, token });
  }
}
