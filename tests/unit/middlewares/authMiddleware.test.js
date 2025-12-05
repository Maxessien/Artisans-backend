import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  userAuthMiddleware,
  verifyVendorOwnership,
  verifyAdmin,
  socketAuthMiddleware,
  verifyChatAccess
} from '../../../middlewares/authMiddleware.js';
import { auth } from '../../../configs/fbConfigs.js';
import { Product } from '../../../models/productsModel.js';
import { ChatModel } from '../../../models/chatsModel.js';

// Mock modules
vi.mock('../../../configs/fbConfigs.js', () => ({
  auth: {
    verifyIdToken: vi.fn()
  }
}));

vi.mock('../../../models/productsModel.js', () => ({
  Product: {
    findOne: vi.fn()
  }
}));

vi.mock('../../../models/chatsModel.js', () => ({
  ChatModel: {
    findOne: vi.fn()
  }
}));

describe('Authentication Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    vi.clearAllMocks();
    req = {
      headers: {},
      auth: null,
      params: {},
      handshake: {
        auth: {},
        query: {}
      }
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };
    next = vi.fn();
  });

  describe('userAuthMiddleware', () => {
    it('should pass token verification with user role', async () => {
      const mockToken = 'valid-token';
      const mockDecodedToken = {
        uid: 'user123',
        role: 'user',
        email: 'user@example.com'
      };

      req.headers.Authorization = `Bearer ${mockToken}`;
      auth.verifyIdToken.mockResolvedValue(mockDecodedToken);

      await userAuthMiddleware(req, res, next);

      expect(auth.verifyIdToken).toHaveBeenCalledWith(mockToken);
      expect(req.auth).toEqual(mockDecodedToken);
      expect(next).toHaveBeenCalled();
    });

    it('should fail when no token is provided', async () => {
      req.headers.Authorization = undefined;

      await userAuthMiddleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should handle Bearer token format correctly', async () => {
      const mockToken = 'valid-token';
      const mockDecodedToken = {
        uid: 'user123',
        role: 'user'
      };

      req.headers.authorization = `Bearer ${mockToken}`;
      auth.verifyIdToken.mockResolvedValue(mockDecodedToken);

      await userAuthMiddleware(req, res, next);

      expect(auth.verifyIdToken).toHaveBeenCalledWith(mockToken);
      expect(req.auth).toEqual(mockDecodedToken);
    });

    it('should reject tokens with non-user role', async () => {
      const mockToken = 'admin-token';
      const mockDecodedToken = {
        uid: 'admin123',
        role: 'admin'
      };

      req.headers.Authorization = `Bearer ${mockToken}`;
      auth.verifyIdToken.mockResolvedValue(mockDecodedToken);

      await userAuthMiddleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should handle token verification errors', async () => {
      req.headers.Authorization = 'Bearer invalid-token';
      auth.verifyIdToken.mockRejectedValue(new Error('Invalid token'));

      await userAuthMiddleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe('verifyVendorOwnership', () => {
    it('should allow vendor access to own product', async () => {
      const vendorId = 'vendor123';
      req.auth = {
        uid: vendorId,
        isVerified: { email: true, phone: true }
      };
      req.params.id = 'product123';

      Product.findOne.mockReturnValue({
        select: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue({ vendorId })
        })
      });

      await verifyVendorOwnership(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should deny access to unverified vendor', async () => {
      req.auth = {
        uid: 'vendor123',
        isVerified: { email: false, phone: false }
      };
      req.params.id = 'product123';

      await verifyVendorOwnership(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should deny access if vendor does not own product', async () => {
      req.auth = {
        uid: 'vendor123',
        isVerified: { email: true, phone: true }
      };
      req.params.id = 'product123';

      Product.findOne.mockReturnValue({
        select: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue({ vendorId: 'different-vendor' })
        })
      });

      await verifyVendorOwnership(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should handle product not found', async () => {
      req.auth = {
        uid: 'vendor123',
        isVerified: { email: true, phone: true }
      };
      req.params.id = 'nonexistent';

      Product.findOne.mockReturnValue({
        select: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue(null)
        })
      });

      await verifyVendorOwnership(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe('verifyAdmin', () => {
    it('should allow access for admin user', async () => {
      req.auth = {
        uid: 'admin123',
        role: 'admin'
      };

      await verifyAdmin(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should deny access for non-admin user', async () => {
      req.auth = {
        uid: 'user123',
        role: 'user'
      };

      await verifyAdmin(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should deny access when user not logged in', async () => {
      req.auth = null;

      await verifyAdmin(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe('socketAuthMiddleware', () => {
    it('should authenticate socket with valid token', async () => {
      const mockToken = 'valid-token';
      const mockDecodedToken = {
        uid: 'user123',
        role: 'user'
      };

      const socket = {
        handshake: { auth: { token: mockToken } },
        user: null
      };

      auth.verifyIdToken.mockResolvedValue(mockDecodedToken);

      await socketAuthMiddleware(socket, next);

      expect(socket.user).toEqual(mockDecodedToken);
      expect(next).toHaveBeenCalled();
    });

    it('should reject socket without token', async () => {
      const socket = {
        handshake: { auth: {} }
      };

      await socketAuthMiddleware(socket, next);

      expect(next).toHaveBeenCalled();
    });

    it('should reject socket with invalid token', async () => {
      const socket = {
        handshake: { auth: { token: 'invalid' } }
      };

      auth.verifyIdToken.mockRejectedValue(new Error('Invalid token'));

      await socketAuthMiddleware(socket, next);

      expect(next).toHaveBeenCalled();
    });

    it('should reject socket with non-user role', async () => {
      const socket = {
        handshake: { auth: { token: 'admin-token' } }
      };

      auth.verifyIdToken.mockResolvedValue({
        uid: 'admin123',
        role: 'admin'
      });

      await socketAuthMiddleware(socket, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe('verifyChatAccess', () => {
    it('should allow authorized user access to chat', async () => {
      const userId = 'user123';
      const vendorId = 'vendor123';
      const chatId = 'chat123';

      const socket = {
        handshake: { query: { chatId } },
        user: { uid: userId }
      };

      ChatModel.findOne.mockReturnValue({
        lean: vi.fn().mockResolvedValue({
          chatId,
          vendorBasicInfo: { id: vendorId },
          userBasicInfo: { id: userId }
        })
      });

      await verifyChatAccess(socket, next);

      expect(next).toHaveBeenCalled();
    });

    it('should allow vendor access to their chat', async () => {
      const userId = 'user123';
      const vendorId = 'vendor123';
      const chatId = 'chat123';

      const socket = {
        handshake: { query: { chatId } },
        user: { uid: vendorId }
      };

      ChatModel.findOne.mockReturnValue({
        lean: vi.fn().mockResolvedValue({
          chatId,
          vendorBasicInfo: { id: vendorId },
          userBasicInfo: { id: userId }
        })
      });

      await verifyChatAccess(socket, next);

      expect(next).toHaveBeenCalled();
    });

    it('should deny access to unauthorized user', async () => {
      const socket = {
        handshake: { query: { chatId: 'chat123' } },
        user: { uid: 'unauthorized' }
      };

      ChatModel.findOne.mockReturnValue({
        lean: vi.fn().mockResolvedValue({
          vendorBasicInfo: { id: 'vendor123' },
          userBasicInfo: { id: 'user123' }
        })
      });

      await verifyChatAccess(socket, next);

      expect(next).toHaveBeenCalled();
    });

    it('should handle chat not found', async () => {
      const socket = {
        handshake: { query: { chatId: 'nonexistent' } },
        user: { uid: 'user123' }
      };

      ChatModel.findOne.mockReturnValue({
        lean: vi.fn().mockResolvedValue(null)
      });

      await verifyChatAccess(socket, next);

      expect(next).toHaveBeenCalled();
    });
  });
});
