import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createUser,
  getUser,
  getVendorInfo,
  updateUser,
  verifyUserCookie,
  setLoggedInUserCookie,
  deleteUserCookie,
  sendOtp,
  verifyOtp
} from '../../../controllers/userAuthControllers.js';
import { auth } from '../../../configs/fbConfigs.js';
import { User } from '../../../models/usersModel.js';
import { AuthOtp } from '../../../models/authOtpModel.js';
import emailjs from '@emailjs/nodejs';

// Mock external modules
vi.mock('../../../configs/fbConfigs.js', () => ({
  auth: {
    createUser: vi.fn(),
    setCustomUserClaims: vi.fn(),
    updateUser: vi.fn(),
    verifyIdToken: vi.fn()
  }
}));

vi.mock('../../../models/usersModel.js', () => ({
  User: {
    create: vi.fn(),
    findOne: vi.fn(),
    findOneAndUpdate: vi.fn(),
    updateOne: vi.fn()
  }
}));

vi.mock('../../../models/authOtpModel.js', () => ({
  AuthOtp: {
    create: vi.fn(),
    findOne: vi.fn()
  }
}));

vi.mock('../../../utils/usersUtilFns.js', () => ({
  populateUserCart: vi.fn().mockResolvedValue([])
}));

vi.mock('@emailjs/nodejs', () => ({
  default: {
    send: vi.fn()
  }
}));

describe('User Auth Controllers', () => {
  let req, res;

  beforeEach(() => {
    vi.clearAllMocks();
    req = {
      body: {},
      params: {},
      query: {},
      auth: {},
      headers: {}
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      cookie: vi.fn().mockReturnThis(),
      clearCookie: vi.fn().mockReturnThis()
    };
  });

  describe('createUser', () => {
    it('should create user successfully with valid data', async () => {
      req.body = {
        displayName: 'John Doe',
        email: 'john@example.com',
        phoneNumber: '1234567890',
        password: 'password123'
      };

      const mockFirebaseUser = {
        uid: 'user123',
        email: 'john@example.com',
        phoneNumber: '+2341234567890'
      };

      auth.createUser.mockResolvedValue(mockFirebaseUser);
      auth.setCustomUserClaims.mockResolvedValue(undefined);
      User.create.mockResolvedValue({ userId: 'user123', ...req.body });

      await createUser(req, res);

      expect(auth.createUser).toHaveBeenCalledWith({
        displayName: 'John Doe',
        email: 'john@example.com',
        phoneNumber: '+2341234567890',
        password: 'password123'
      });
      expect(User.create).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ message: 'Account created successfully' });
    });

    it('should handle email already exists error', async () => {
      req.body = {
        displayName: 'John Doe',
        email: 'existing@example.com',
        phoneNumber: '1234567890',
        password: 'password123'
      };

      auth.createUser.mockRejectedValue({ code: 'auth/email-already-exists' });

      await createUser(req, res);

      expect(res.status).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalled();
    });

    it('should handle weak password error', async () => {
      req.body = {
        displayName: 'John Doe',
        email: 'john@example.com',
        phoneNumber: '1234567890',
        password: 'weak'
      };

      auth.createUser.mockRejectedValue({ code: 'auth/weak-password' });

      await createUser(req, res);

      expect(res.status).toHaveBeenCalled();
    });
  });

  describe('getUser', () => {
    it('should return user with populated cart', async () => {
      req.auth = { uid: 'user123' };

      const mockUser = {
        _id: '123',
        userId: 'user123',
        displayName: 'John Doe',
        email: 'john@example.com',
        cart: []
      };

      User.findOne.mockReturnValue({
        lean: vi.fn().mockResolvedValue(mockUser)
      });

      await getUser(req, res);

      expect(User.findOne).toHaveBeenCalledWith({ userId: 'user123' });
      expect(res.status).toHaveBeenCalledWith(202);
    });

    it('should return 404 when user not found', async () => {
      req.auth = { uid: 'nonexistent' };

      User.findOne.mockReturnValue({
        lean: vi.fn().mockResolvedValue(null)
      });

      await getUser(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'User not found' });
    });

    it('should handle database error', async () => {
      req.auth = { uid: 'user123' };

      User.findOne.mockReturnValue({
        lean: vi.fn().mockRejectedValue(new Error('DB error'))
      });

      await getUser(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('getVendorInfo', () => {
    it('should return vendor info with selected fields', async () => {
      req.params.id = 'vendor123';

      const mockVendor = {
        displayName: 'Vendor Store',
        email: 'vendor@example.com',
        phoneNumber: '+2341234567890'
      };

      User.findOne.mockReturnValue({
        select: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue(mockVendor)
        })
      });

      await getVendorInfo(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockVendor);
    });

    it('should handle vendor not found', async () => {
      req.params.id = 'nonexistent';

      User.findOne.mockReturnValue({
        select: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue(null)
        })
      });

      await getVendorInfo(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('updateUser', () => {
    it('should update user in both auth and db', async () => {
      req.auth = { uid: 'user123' };
      req.body = { displayName: 'New Name' };
      req.query = {};

      const updatedUser = { userId: 'user123', displayName: 'New Name' };

      User.findOneAndUpdate.mockReturnValue({
        lean: vi.fn().mockResolvedValue(updatedUser)
      });

      await updateUser(req, res);

      expect(auth.updateUser).toHaveBeenCalled();
      expect(User.findOneAndUpdate).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should only update db when type is dbOnly', async () => {
      req.auth = { uid: 'user123' };
      req.body = { displayName: 'New Name' };
      req.query = { type: 'dbOnly' };

      User.findOneAndUpdate.mockReturnValue({
        lean: vi.fn().mockResolvedValue({})
      });

      await updateUser(req, res);

      expect(auth.updateUser).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should handle update error', async () => {
      req.auth = { uid: 'user123' };
      req.body = { displayName: 'New Name' };
      req.query = {};

      auth.updateUser.mockRejectedValue({ code: 'auth/user-not-found' });

      await updateUser(req, res);

      expect(res.status).toHaveBeenCalled();
    });
  });

  describe('verifyUserCookie', () => {
    it('should return verified user data', async () => {
      req.auth = { uid: 'user123', role: 'user' };

      const mockUser = {
        userId: 'user123',
        displayName: 'John Doe',
        email: 'john@example.com'
      };

      User.findOne.mockReturnValue({
        lean: vi.fn().mockResolvedValue(mockUser)
      });

      await verifyUserCookie(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
    });

    it('should handle verification error', async () => {
      req.auth = { uid: 'user123' };

      User.findOne.mockReturnValue({
        lean: vi.fn().mockRejectedValue(new Error('DB error'))
      });

      await verifyUserCookie(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('setLoggedInUserCookie', () => {
    it('should set user session cookie', async () => {
      req.body = { idToken: 'test-token' };

      await setLoggedInUserCookie(req, res);

      expect(res.cookie).toHaveBeenCalledWith(
        'userSessionToken',
        'test-token',
        expect.objectContaining({
          maxAge: expect.any(Number),
          path: '/',
          httpOnly: true
        })
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should set secure flag based on environment', async () => {
      req.body = { idToken: 'test-token' };
      process.env.NODE_ENV = 'production';

      await setLoggedInUserCookie(req, res);

      expect(res.cookie).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.objectContaining({ secure: true })
      );
    });

    it('should handle cookie error', async () => {
      req.body = { idToken: 'test-token' };

      res.cookie.mockImplementation(() => {
        throw new Error('Cookie error');
      });

      await setLoggedInUserCookie(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('deleteUserCookie', () => {
    it('should clear user session cookie', async () => {
      await deleteUserCookie(req, res);

      expect(res.clearCookie).toHaveBeenCalledWith(
        'userSessionToken',
        expect.objectContaining({
          maxAge: 0,
          path: '/',
          httpOnly: true
        })
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('sendOtp', () => {
    it('should create and send OTP for email', async () => {
      req.body = { type: 'email', value: 'user@example.com' };

      const mockOtp = {
        otpType: 'email',
        reciever: 'user@example.com',
        value: 123456,
        expiryTime: Date.now() + 300000
      };

      AuthOtp.create.mockResolvedValue(mockOtp);

      await sendOtp(req, res);

      expect(AuthOtp.create).toHaveBeenCalledWith({
        otpType: 'email',
        reciever: 'user@example.com'
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ message: 'Otp sent' });
    });

    it('should send email in production', async () => {
      req.body = { type: 'email', value: 'user@example.com' };
      process.env.NODE_ENV = 'production';

      const mockOtp = {
        value: 123456,
        otpType: 'email',
        reciever: 'user@example.com'
      };

      AuthOtp.create.mockResolvedValue(mockOtp);

      await sendOtp(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should handle OTP creation error', async () => {
      req.body = { type: 'email', value: 'user@example.com' };

      AuthOtp.create.mockRejectedValue(new Error('OTP error'));

      await sendOtp(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('verifyOtp', () => {
    it('should verify valid OTP and update claims', async () => {
      req.body = { otpValue: '123456', type: 'email' };
      req.auth = {
        uid: 'user123',
        email: 'user@example.com',
        phone_number: '+2341234567890',
        isVerified: { email: false, phone: true }
      };

      const mockOtp = {
        value: 123456,
        expiryTime: Date.now() + 300000,
        reciever: 'user@example.com'
      };

      AuthOtp.findOne.mockReturnValue({
        lean: vi.fn().mockResolvedValue(mockOtp)
      });

      await verifyOtp(req, res);

      expect(auth.setCustomUserClaims).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should reject expired OTP', async () => {
      req.body = { otpValue: '123456', type: 'email' };
      req.auth = {
        uid: 'user123',
        email: 'user@example.com',
        isVerified: { email: false }
      };

      const mockOtp = {
        value: 123456,
        expiryTime: Date.now() - 1000, // Expired
        reciever: 'user@example.com'
      };

      AuthOtp.findOne.mockReturnValue({
        lean: vi.fn().mockResolvedValue(mockOtp)
      });

      await verifyOtp(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });

    it('should reject OTP sent to different email', async () => {
      req.body = { otpValue: '123456', type: 'email' };
      req.auth = {
        uid: 'user123',
        email: 'user@example.com',
        isVerified: { email: false }
      };

      const mockOtp = {
        value: 123456,
        expiryTime: Date.now() + 300000,
        reciever: 'different@example.com'
      };

      AuthOtp.findOne.mockReturnValue({
        lean: vi.fn().mockResolvedValue(mockOtp)
      });

      await verifyOtp(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });

    it('should handle OTP lookup error', async () => {
      req.body = { otpValue: '123456', type: 'email' };
      req.auth = { uid: 'user123' };

      AuthOtp.findOne.mockReturnValue({
        lean: vi.fn().mockRejectedValue(new Error('DB error'))
      });

      await verifyOtp(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
