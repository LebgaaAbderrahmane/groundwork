import { z } from 'zod'
import { USER_ROLE } from './domain'

export const loginInput = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

export const registerInput = loginInput.extend({
  name: z.string().min(1).max(80),
})

export const inviteStaffInput = z.object({
  name: z.string().min(1).max(80),
  email: z.string().email(),
  role: z.enum(USER_ROLE),
  password: z.string().min(8),
})

export const updateRoleInput = z.object({
  userId: z.string().min(1),
  role: z.enum(USER_ROLE),
})

export const setActiveInput = z.object({
  userId: z.string().min(1),
  active: z.boolean(),
})
