import type { Response } from 'express';

export class ResponseHandler {
  static success(res: Response, data: any = null, message: string = 'Success', code: number = 200) {
    return res.status(code).json({
      success: true,
      code,
      message,
      data,
    });
  }

  static error(
    res: Response,
    message: string = 'Something went wrong',
    code: number = 500,
    data: any = null,
  ) {
    return res.status(code).json({
      success: false,
      code,
      message,
      data,
    });
  }
}
