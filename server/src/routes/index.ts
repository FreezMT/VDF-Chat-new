import { Router } from 'express'
import { asyncHandler } from '../utils/asyncHandler.js'
import * as auth from '../controllers/authController.js'
import * as users from '../controllers/usersController.js'
import * as chats from '../controllers/chatsController.js'
import * as feed from '../controllers/feedController.js'
import * as admin from '../controllers/adminController.js'
import * as push from '../controllers/pushController.js'
import * as upload from '../controllers/uploadController.js'
import { requireAuth } from '../middleware/auth.js'
import { requireRoles } from '../middleware/roles.js'
import { uploadMiddleware } from '../middleware/upload.js'

const r = Router()

r.post('/auth/register', asyncHandler(auth.register))
r.post('/auth/login', asyncHandler(auth.login))
r.post('/auth/refresh', asyncHandler(auth.refresh))
r.post('/auth/logout', asyncHandler(auth.logout))

r.get('/users/me', requireAuth, asyncHandler(users.getMe))
r.put('/users/me', requireAuth, asyncHandler(users.updateMe))
r.get('/users/friends', requireAuth, asyncHandler(users.listFriends))
r.post('/users/friend/:userId', requireAuth, asyncHandler(users.addFriend))
r.get('/users/:visibleId', requireAuth, asyncHandler(users.getByVisibleId))

r.get('/chats', requireAuth, asyncHandler(chats.listChats))
r.post('/chats/private/:userId', requireAuth, asyncHandler(chats.privateChat))
r.post(
  '/chats/group',
  requireAuth,
  requireRoles('trainer', 'admin'),
  asyncHandler(chats.createGroup),
)
r.get('/chats/:chatId/messages', requireAuth, asyncHandler(chats.getMessages))
r.post('/chats/:chatId/read', requireAuth, asyncHandler(chats.markRead))

r.get('/feed', requireAuth, asyncHandler(feed.listFeed))
r.post(
  '/feed',
  requireAuth,
  requireRoles('trainer', 'admin'),
  asyncHandler(feed.createPost),
)
r.delete('/feed/:postId', requireAuth, asyncHandler(feed.deletePost))

r.get('/admin/users', requireAuth, requireRoles('admin'), asyncHandler(admin.listUsers))
r.put(
  '/admin/users/:id/role',
  requireAuth,
  requireRoles('admin'),
  asyncHandler(admin.setUserRole),
)
r.post('/admin/teams', requireAuth, requireRoles('admin'), asyncHandler(admin.createTeam))
r.put(
  '/admin/users/:id/team',
  requireAuth,
  requireRoles('admin'),
  asyncHandler(admin.setUserTeam),
)
r.delete(
  '/admin/users/:id',
  requireAuth,
  requireRoles('admin'),
  asyncHandler(admin.deleteUser),
)

r.get('/push/vapid-public', asyncHandler(push.getVapidPublic))
r.post('/push/subscribe', requireAuth, asyncHandler(push.subscribe))
r.delete('/push/unsubscribe', requireAuth, asyncHandler(push.unsubscribe))

r.post(
  '/upload',
  requireAuth,
  uploadMiddleware.single('file'),
  asyncHandler(upload.uploadFile),
)

export const apiRouter = r
