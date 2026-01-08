// src/utils/ResponseHandler.ts
import type { Response } from 'express';

export class ResponseHandler {
  private static withRequestId(res: Response, payload: any) {
    const requestId = (res.req as any)?.ctx?.requestId;

    if (!requestId) return payload;

    return {
      ...payload,
      requestId,
    };
  }

  static success(res: Response, data: any = null, message: string = 'Success', code: number = 200) {
    const response = {
      success: true,
      code,
      message,
      data,
    };

    return res.status(code).json(this.withRequestId(res, response));
  }

  static error(
    res: Response,
    message: string = 'Something went wrong',
    code: number = 500,
    data: any = null,
  ) {
    const response = {
      success: false,
      code,
      message,
      data,
    };

    return res.status(code).json(this.withRequestId(res, response));
  }
}
