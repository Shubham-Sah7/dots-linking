/**
 * Example usage of Prisma Client
 * 
 * This file demonstrates how to use the Prisma client in your application.
 * You can import `prisma` from './prisma' and use it to interact with your database.
 */

import { prisma } from './prisma'

// Example: Create a new user
export async function createUser(email: string, name?: string) {
  const user = await prisma.user.create({
    data: {
      email,
      name,
    },
  })
  return user
}

// Example: Get all users
export async function getAllUsers() {
  const users = await prisma.user.findMany({
    include: {
      posts: true, // Include related posts
    },
  })
  return users
}

// Example: Get a user by email
export async function getUserByEmail(email: string) {
  const user = await prisma.user.findUnique({
    where: {
      email,
    },
    include: {
      posts: true,
    },
  })
  return user
}

// Example: Create a post for a user
export async function createPost(
  authorId: string,
  title: string,
  content?: string,
  published: boolean = false
) {
  const post = await prisma.post.create({
    data: {
      title,
      content,
      published,
      authorId,
    },
  })
  return post
}

// Example: Get all published posts
export async function getPublishedPosts() {
  const posts = await prisma.post.findMany({
    where: {
      published: true,
    },
    include: {
      author: true, // Include author information
    },
    orderBy: {
      createdAt: 'desc',
    },
  })
  return posts
}

// Example: Update a user
export async function updateUser(id: string, data: { name?: string; email?: string }) {
  const user = await prisma.user.update({
    where: {
      id,
    },
    data,
  })
  return user
}

// Example: Delete a user (will cascade delete their posts)
export async function deleteUser(id: string) {
  const user = await prisma.user.delete({
    where: {
      id,
    },
  })
  return user
}
