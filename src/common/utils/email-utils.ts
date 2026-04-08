import nodemailer from 'nodemailer';
import { getRedisUtil } from './redis.util';
import { Tool } from './tool.util.js';
import { MiYao } from '@/common/models';
import { WhereOptions } from 'sequelize';
import { CustomError } from '@/common/errors/custom.error';
import { ErrorType } from './enums';

type MailConfig = {
  username: string;
  password: string;
  sendModel: string; // smtp.qq.com / smtp.163.com / etc
};

export class MailUtil {
  /** 复用全局 Redis 单例，验证码存 Redis 并设置 1 分钟过期 */
  private static redis = getRedisUtil();

  /**
   * 发邮箱内容
   */
  static async sendContent(to: string, subject: string, config?: MailConfig, htmlOverride?: string): Promise<boolean> {
    const html = htmlOverride;
    if (!config) {
      config = await this.getConfig();
    }
    if (!config) {
      throw new CustomError(ErrorType.EMAIL_ERROR, '邮箱发送失败', 500);
    }
    return await MailUtil.sendMail(to, subject, html, config);
  }

  /**
   *  发送验证码
   *  若该 account 在 60 秒内已有未使用的验证码，则抛出错误并提示剩余秒数
   */
  static async sendCode(to: string, subject: string, config?: MailConfig) {
    const redisKey = `code:${to}`;
    const existing = await this.redis.exists(redisKey);
    if (existing) {
      const ttl = await this.redis.ttl(redisKey);
      const seconds = ttl > 0 ? ttl : 60;
      throw new CustomError(ErrorType.FREQUENT_REQUESTS, `验证码已发送，请 ${seconds} 秒后再请求`, 429);
    }
    const code = MailUtil.generateCode();
    await this.redis.set(redisKey, code, 300); // 5分钟有效
    const html = MailUtil.buildDefaultMailHTML(code);
    if (!config) {
      config = await this.getConfig();
    }
    if (!config) {
      throw new CustomError(ErrorType.EMAIL_ERROR, '邮箱发送失败', 500);
    }
    await MailUtil.sendMail(to, subject, html, config);
    return code;
  }

  public static async sendMail(to: string, subject: string, html: string | undefined, config: MailConfig): Promise<boolean> {
    try {
      const transporter = nodemailer.createTransport({
        host: config.sendModel,
        port: 465,
        secure: true,
        auth: {
          user: config.username,
          pass: config.password,
        },
      });

      await transporter.sendMail({
        from: config.username,
        to,
        subject,
        html,
      });

      return true;
    } catch (error) {
      console.error('邮件发送失败：', error);
      return false;
    }
  }

  public static async getConfig() {
    const accountWhere: WhereOptions = {
      miyaoKey: 'MAIL_ACCOUNT',
    };
    const passwordWhere: WhereOptions = {
      miyaoKey: 'MAIL_PASSWORD',
    };
    const sendModelWhere: WhereOptions = {
      miyaoKey: 'MAIL_SEND_MODEL',
    };
    const usernameData: any = await MiYao.findOne({ where: accountWhere, raw: true });
    const passwordData: any = await MiYao.findOne({ where: passwordWhere, raw: true });
    const sendModelData: any = await MiYao.findOne({ where: sendModelWhere, raw: true });

    return {
      username: usernameData.miyaoValue,
      password: passwordData.miyaoValue,
      sendModel: sendModelData.miyaoValue,
    };
  }

  public static generateCode(): string {
    return Tool.generateCode();
  }

  public static buildDefaultMailHTML(code: string): string {
    return (
      '<div style=\'max-width: 600px; margin: 0 auto; font-family: "Segoe UI", Arial, sans-serif;\'>' +
      '<div style=\'display: flex; align-items: center; gap: 8px; background: linear-gradient(90deg, #4F46E5, #6366F1); padding: 12px 20px; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); color: white; font-family: "Segoe UI", sans-serif; font-weight: bold; font-size: 24px; cursor: pointer; transition: all 0.3s ease;\' ' +
      "onmouseover=\"this.style.transform='scale(1.05)'; this.style.boxShadow='0 6px 20px rgba(0,0,0,0.2)';\"" +
      "onmouseout=\"this.style.transform='scale(1)'; this.style.boxShadow='0 4px 10px rgba(0,0,0,0.1)';\"" +
      "onclick=\"this.style.background='linear-gradient(90deg, #6366F1, #4F46E5)'; setTimeout(()=>this.style.background='linear-gradient(90deg, #4F46E5, #6366F1)', 300);\">" +
      "<div style='background: white; color: #4F46E5; font-weight: 900; font-size: 20px; padding: 6px 10px; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.2); transition: all 0.3s ease;'" +
      'onmouseover="this.style.transform=\'rotate(10deg)\';"' +
      'onmouseout="this.style.transform=\'rotate(0deg)\';">Y</div>' +
      "<div style='letter-spacing: 1px;'>Yours<span style='color: #FACC15;'>AI</span></div>" +
      '</div>' +
      "<div style='background: white; padding: 30px; border-radius: 12px; margin-top: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.05);'>" +
      "<h2 style='color: #4F46E5; margin-top: 0;'>您好！</h2>" +
      "<p style='font-size: 16px; line-height: 1.6; color: #333;'>感谢您使用YoursAI服务。以下是您的验证码：</p>" +
      "<div style='background: #F3F4F6; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;'>" +
      "<span style='font-size: 28px; font-weight: bold; letter-spacing: 2px; color: #4F46E5;'>" +
      code +
      '</span>' +
      '</div>' +
      "<p style='font-size: 16px; line-height: 1.6; color: #666;'>请在 <span style='font-weight: bold; color: #4F46E5;'>2分钟</span> 内使用此验证码完成验证。</p>" +
      "<p style='font-size: 14px; color: #999; margin-top: 30px;'>如非本人操作，请忽略此邮件。请勿将验证码透露给他人。</p>" +
      '</div>' +
      "<div style='text-align: center; margin-top: 30px; color: #999; font-size: 12px;'>" +
      '<p>© 2026 YoursAI 团队. 保留所有权利.</p>' +
      '</div>' +
      '</div>'
    );
  }
}
