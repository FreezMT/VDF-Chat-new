import { Router } from 'express'
import { asyncHandler } from '../utils/asyncHandler.js'
import { requireAuth } from '../middleware/auth.js'
import { requireRoles } from '../middleware/roles.js'
import * as auth from '../controllers/authController.js'
import * as users from '../controllers/usersController.js'
import * as chats from '../controllers/chatsController.js'
import * as feed from '../controllers/feedController.js'
import * as admin from '../controllers/adminController.js'
import * as push from '../controllers/pushController.js'
import * as upload from '../controllers/uploadController.js'
import { upload as multerUpload } from '../middleware/upload.js'

export const apiRouter = Router()

apiRouter.post('/auth/register', asyncHandler(auth.register))
apiRouter.post('/auth/login', asyncHandler(auth.login))
apiRouter.post('/auth/refresh', asyncHandler(auth.refresh))
apiRouter.post('/auth/logout', asyncHandler(auth.logout))

apiRouter.get('/users/me', requireAuth, asyncHandler(users.meGet))
apiRouter.put('/users/me', requireAuth, asyncHandler(users.mePut))
apiRouter.get('/users/friends', requireAuth, asyncHandler(users.listFriends))
apiRouter.get('/users/:visibleId', requireAuth, asyncHandler(users.findByVisibleId))
apiRouter.post('/users/friend/:userId', requireAuth, asyncHandler(users.addFriend))

apiRouter.get('/chats', requireAuth, asyncHandler(chats.listChats))
apiRouter.post('/chats/private/:userId', requireAuth, asyncHandler(chats.getOrCreatePrivate))
apiRouter.post(
  '/chats/group',
  requireAuth,
  requireRoles('trainer', 'admin'),
  asyncHandler(chats.createGroup),
)
apiRouter.get('/chats/:chatId/messages', requireAuth, asyncHandler(chats.getMessages))
apiRouter.post('/chats/:chatId/read', requireAuth, asyncHandler(chats.markRead))

apiRouter.get('/feed', requireAuth, asyncHandler(feed.listFeed))
apiRouter.post(
  '/feed',
  requireAuth,
  requireRoles('trainer', 'admin'),
  asyncHandler(feed.createPost),
)
apiRouter.delete('/feed/:postId', requireAuth, asyncHandler(feed.deletePost))

apiRouter.get('/admin/users', requireAuth, requireRoles('admin'), asyncHandler(admin.listUsers))
apiRouter.put('/admin/users/:id/role', requireAuth, requireRoles('admin'), asyncHandler(admin.setRole))
apiRouter.post('/admin/teams', requireAuth, requireRoles('admin'), asyncHandler(admin.createTeam))
apiRouter.put('/admin/users/:id/team', requireAuth, requireRoles('admin'), asyncHandler(admin.assignTeam))
apiRouter.delete('/admin/users/:id', requireAuth, requireRoles('admin'), asyncHandler(admin.deleteUser))

apiRouter.post('/push/subscribe', requireAuth, asyncHandler(push.subscribe))
apiRouter.delete('/push/unsubscribe', requireAuth, asyncHandler(push.unsubscribe))

apiRouter.post(
  '/upload',
  requireAuth,
  multerUpload.single('file'),
  asyncHandler(upload.uploadFile),
)
