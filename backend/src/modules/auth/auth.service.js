import * as argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import prisma from '../../config/prisma.js';
import config from '../../config/env.js';

export const registerUser = async (data) => {
  const existing = await prisma.user.findFirst({
    where: {
      OR: [
        { email: data.email.toLowerCase() },
        { mobileNumber: data.mobileNumber },
      ],
    },
  });

  if (existing) {
    if (existing.email.toLowerCase() === data.email.toLowerCase()) {
      throw new Error('A user with this email address already exists');
    }
    throw new Error('A user with this mobile number already exists');
  }

  // Calculate age from dateOfBirth
  const birthDate = new Date(data.dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  if (age < 18) {
    throw new Error('Must be at least 18 years old to register');
  }

  // Hash password using Argon2id
  const passwordHash = await argon2.hash(data.password, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
  });

  const newUser = await prisma.user.create({
    data: {
      email: data.email.toLowerCase(),
      passwordHash,
      mobileNumber: data.mobileNumber,
      fullName: data.fullName,
      displayName: data.displayName,
      dateOfBirth: birthDate,
      age,
      gender: data.gender,
      interestedIn: data.interestedIn,
      city: data.city,
      state: data.state,
      collegeName: data.collegeName,
      course: data.course || null,
      avatarUrl: data.avatarUrl,
      additionalPhotos: data.additionalPhotos,
      verificationIdUrl: data.verificationIdUrl,
      verificationIdType: data.verificationIdType || 'COLLEGE_ID',
      relationshipIntention: data.relationshipIntention,
      verificationStatus: 'PENDING_APPROVAL',
      role: 'STUDENT',
    },
    select: {
      id: true,
      email: true,
      mobileNumber: true,
      fullName: true,
      displayName: true,
      age: true,
      collegeName: true,
      course: true,
      avatarUrl: true,
      additionalPhotos: true,
      verificationIdType: true,
      verificationStatus: true,
      createdAt: true,
    },
  });

  return {
    user: newUser,
    status: 'PENDING_APPROVAL',
    message: 'Your registration was submitted successfully! It is now pending admin review. Once an admin verifies your College/Govt ID and photos, you will be able to log in.',
  };
};

export const loginUser = async (identifier, password) => {
  const isEmail = identifier.includes('@');
  const user = await prisma.user.findFirst({
    where: isEmail
      ? { email: identifier.toLowerCase() }
      : { mobileNumber: identifier.trim() },
  });

  if (!user) {
    throw new Error('Incorrect credentials. No account found with this email or mobile number.');
  }

  const isMatch = await argon2.verify(user.passwordHash, password);
  if (!isMatch) {
    throw new Error('Incorrect password. Please try again.');
  }

  const sanitizedUser = {
    id: user.id,
    email: user.email,
    mobileNumber: user.mobileNumber,
    fullName: user.fullName,
    displayName: user.displayName,
    age: user.age,
    gender: user.gender,
    collegeName: user.collegeName,
    course: user.course,
    relationshipIntention: user.relationshipIntention,
    currentMood: user.currentMood,
    subscriptionPlan: user.subscriptionPlan,
    sentRequestsCount: user.sentRequestsCount,
    avatarUrl: user.avatarUrl,
    additionalPhotos: user.additionalPhotos,
    verificationStatus: user.verificationStatus,
    rejectionReason: user.rejectionReason,
    role: user.role,
  };

  // Check Admin Verification Approval Status
  if (user.verificationStatus === 'PENDING_APPROVAL') {
    return {
      status: 'PENDING_APPROVAL',
      user: sanitizedUser,
      message: 'Your account is currently under admin review. Campus administrators are checking your ID proof and photos. Please check back shortly.',
    };
  }

  if (user.verificationStatus === 'REJECTED') {
    return {
      status: 'REJECTED',
      user: sanitizedUser,
      reason: user.rejectionReason || 'Verification ID or photos did not meet guidelines.',
      message: 'Your verification was declined. Please update your details and re-upload your valid ID.',
    };
  }

  // User is APPROVED
  const token = jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );

  return {
    status: 'APPROVED',
    user: sanitizedUser,
    token,
    message: 'Login successful! Welcome to Collégé.',
  };
};

export default { registerUser, loginUser };
