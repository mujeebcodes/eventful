// import { ExtractJwt, Strategy } from 'passport-jwt';
// import { PassportStrategy } from '@nestjs/passport';
// import { Injectable } from '@nestjs/common';
// import { jwtSecret } from 'src/utils/constants';
// import { Request } from 'express';

// @Injectable()
// export class JwtStrategy extends PassportStrategy(Strategy) {
//   constructor() {
//     super({
//       jwtFromRequest: ExtractJwt.fromExtractors([
//         JwtStrategy.extractJWT,
//         ExtractJwt.fromAuthHeaderAsBearerToken(),
//       ]),
//       secretOrKey: jwtSecret,
//     });
//   }

//   private static extractJWT(req: Request): string | null {
//     if (req.cookies && 'token' in req.cookies) {
//       return req.cookies.token;
//     }
//     return null;
//   }

//   async validate(payload: { id: string; email: string; role: string }) {
//     return payload;
//   }
// }
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { jwtSecret } from 'src/utils/constants';
import { Request } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        JwtStrategy.extractUserJWT,
        JwtStrategy.extractOrganizerJWT,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      secretOrKey: jwtSecret,
    });
  }

  private static extractUserJWT(req: Request): string | null {
    if (req.cookies && 'token' in req.cookies) {
      return req.cookies.token;
    }
    return null;
  }

  private static extractOrganizerJWT(req: Request): string | null {
    if (req.cookies && 'orgtoken' in req.cookies) {
      return req.cookies.orgtoken;
    }
    return null;
  }

  async validate(payload: { id: string; email: string; role: string }) {
    return payload;
  }
}
