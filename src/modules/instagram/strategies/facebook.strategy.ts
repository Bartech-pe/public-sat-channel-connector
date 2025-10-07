import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-facebook';

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
  constructor(configService: ConfigService) {
    super({
      clientID: configService.get<string>('FACEBOOK_APP_ID')!,
      clientSecret: configService.get<string>('FACEBOOK_APP_SECRET')!,
      callbackURL: configService.get<string>('META_REDIRECT_URI')!,
      scope: [
        'pages_manage_metadata',
        'pages_read_engagement',
        'pages_messaging',
        'business_management',
        'pages_show_list',
        'instagram_basic',
        'instagram_manage_messages',
        "instagram_manage_upcoming_events"
      ],
      profileFields: ['id', 'displayName', 'email']
    });
  }
  async validate(accessToken: string, refreshToken: string, profile: any, done: any) {
    console.log('🔐 Facebook auth validation:', {
      profileId: profile.id,
      displayName: profile.displayName,
      email: profile.emails?.[0]?.value
    });

    const user = {
      id: profile.id,
      username: profile.displayName,
      email: profile.emails?.[0]?.value,
      accessToken,
      refreshToken,
    };
    
    done(null, user);
  }
}