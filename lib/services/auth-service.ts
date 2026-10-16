import { IUserRepository, userRepository } from '@/lib/repositories/user-repository';
import { hashPassword, verifyPassword, signSessionToken, verifySessionToken } from '@/lib/auth/security';
import { RegisterInput, LoginInput, UpdateProfileInput } from '@/lib/validation/auth';
import { User, UserPublicProfile, SavedProviderRecord, SessionPayload } from '@/lib/types/auth';

export class AuthService {
  constructor(private userRepo: IUserRepository = userRepository) {}

  async register(input: RegisterInput): Promise<{ user: UserPublicProfile; token: string }> {
    const existing = await this.userRepo.findByEmail(input.email);
    if (existing) {
      throw new Error('An account with this email address already exists.');
    }

    const passwordHash = await hashPassword(input.password);

    const newUser = await this.userRepo.createUser({
      name: input.name,
      email: input.email,
      passwordHash,
      role: 'traveler',
      preferredLanguage: input.preferredLanguage || 'English',
    });

    const token = signSessionToken({
      userId: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
    });

    return {
      user: this.toPublicProfile(newUser),
      token,
    };
  }

  async login(input: LoginInput): Promise<{ user: UserPublicProfile; token: string }> {
    const user = await this.userRepo.findByEmail(input.email);
    if (!user) {
      throw new Error('Invalid email or password.');
    }

    const isValid = await verifyPassword(input.password, user.passwordHash);
    if (!isValid) {
      throw new Error('Invalid email or password.');
    }

    const token = signSessionToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    return {
      user: this.toPublicProfile(user),
      token,
    };
  }

  async getSessionUser(token: string): Promise<UserPublicProfile | null> {
    const payload = verifySessionToken(token);
    if (!payload) return null;

    const user = await this.userRepo.findById(payload.userId);
    return user ? this.toPublicProfile(user) : null;
  }

  async updateProfile(userId: string, input: UpdateProfileInput): Promise<UserPublicProfile | null> {
    const updated = await this.userRepo.updateProfile(userId, input);
    return updated ? this.toPublicProfile(updated) : null;
  }

  // OBJECT-LEVEL AUTHORIZATION: Saved providers are scoped strictly to the authenticated userId
  async getSavedProviders(userId: string): Promise<SavedProviderRecord[]> {
    return this.userRepo.getSavedProviders(userId);
  }

  async saveProvider(userId: string, providerId: string, notes?: string): Promise<SavedProviderRecord | null> {
    return this.userRepo.saveProvider(userId, providerId, notes);
  }

  async removeSavedProvider(userId: string, recordIdOrProviderId: string): Promise<boolean> {
    return this.userRepo.removeSavedProvider(userId, recordIdOrProviderId);
  }

  async isProviderSaved(userId: string, providerId: string): Promise<boolean> {
    return this.userRepo.isProviderSaved(userId, providerId);
  }

  private toPublicProfile(user: User): UserPublicProfile {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      preferredLanguage: user.preferredLanguage,
      createdAt: user.createdAt,
    };
  }
}

export const authService = new AuthService();

