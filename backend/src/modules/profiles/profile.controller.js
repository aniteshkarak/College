import prisma from '../../config/prisma.js';
import { serializePrivateAccount } from '../../utils/serializers.js';
import { success, error } from '../../utils/response.js';
import { imageService } from '../../services/imageService.js';
import socketService from '../../services/socketService.js';
import { validateMood } from '../users/users.routes.js';
import { z } from 'zod';

const updateProfileSchema = z.object({
  displayName: z.string().min(2, 'Display name must be at least 2 characters').max(50).optional(),
  display_name: z.string().min(2).max(50).optional(),
  fullName: z.string().min(2).max(100).optional(),
  full_name: z.string().min(2).max(100).optional(),
  dateOfBirth: z.string().optional(),
  date_of_birth: z.string().optional(),
  age: z.number().int().min(18, 'You must be at least 18 years old to join Collage Story.').max(100).optional(),
  gender: z.string().optional(),
  bio: z.string().max(500, 'Bio cannot exceed 500 characters').optional(),
  collegeName: z.string().max(150).optional(),
  college_name: z.string().max(150).optional(),
  course: z.string().max(100).optional(),
  degreeName: z.string().max(100).optional(),
  degree_name: z.string().max(100).optional(),
  departmentStream: z.string().max(100).optional(),
  department_stream: z.string().max(100).optional(),
  academicYear: z.string().max(50).optional(),
  academic_year: z.string().max(50).optional(),
  interests: z.array(z.string()).optional(),
  hobbies: z.array(z.string()).optional(),
  languages: z.array(z.string()).optional(),
  languagesSpoken: z.array(z.string()).optional(),
  languages_spoken: z.array(z.string()).optional(),
  relationshipIntention: z.string().optional(),
  relationship_intention: z.string().optional(),
  lookingFor: z.string().optional(),
  looking_for: z.string().optional(),
  interested_in: z.array(z.string()).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  currentMood: z.string().max(100).optional(),
  mood: z.string().max(100).optional(),
});

/**
 * GET /api/v1/profiles/me
 * Retrieves current authenticated user's private account details
 */
export const getMyProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        profile: true,
        education: { include: { college: true } },
        photos: { orderBy: { photoOrder: 'asc' } },
      },
    });

    if (!user) {
      return error(res, 'User not found', 404);
    }

    const serialized = serializePrivateAccount(user);
    return success(res, { profile: serialized, user: serialized }, 'Current user profile retrieved');
  } catch (err) {
    return error(res, err.message, 500);
  }
};

/**
 * PUT /api/v1/profiles/me & PUT /api/v1/users/profile
 * Saves edited profile information directly to PostgreSQL using transaction.
 */
export const updateMyProfile = async (req, res) => {
  try {
    // Prevent modification of security-sensitive or admin-only fields
    const forbiddenFields = [
      'role',
      'accountStatus',
      'verificationStatus',
      'subscriptionPlan',
      'passwordHash',
      'approvedAt',
      'approvedByAdminId',
    ];
    for (const field of forbiddenFields) {
      if (req.body[field] !== undefined) {
        delete req.body[field];
      }
    }

    const parsed = updateProfileSchema.safeParse(req.body);
    if (!parsed.success) {
      return error(res, 'Validation failed: Please check entered profile values.', 400, parsed.error.issues);
    }

    const data = parsed.data;

    // Resolve unified field values supporting both camelCase and snake_case
    const displayName = data.displayName || data.display_name;
    const fullName = data.fullName || data.full_name;
    const dobString = data.dateOfBirth || data.date_of_birth;
    const gender = data.gender;
    const bio = data.bio;
    const collegeName = data.collegeName || data.college_name;
    const course = data.course || data.degreeName || data.degree_name;
    const departmentStream = data.departmentStream || data.department_stream;
    const academicYear = data.academicYear || data.academic_year;
    const interests = data.interests;
    const hobbies = data.hobbies;
    const languages = data.languages || data.languagesSpoken || data.languages_spoken;
    const relationshipIntention = data.relationshipIntention || data.relationship_intention;
    const lookingFor = data.lookingFor || data.looking_for || (data.interested_in ? data.interested_in[0] : undefined);
    const city = data.city;
    const state = data.state;
    const currentMood = data.currentMood || data.mood;

    // Validate 18+ eligibility if date of birth is supplied
    let calculatedAge = data.age;
    let birthDate = null;
    if (dobString) {
      birthDate = new Date(dobString);
      if (isNaN(birthDate.getTime())) {
        return error(res, 'Invalid date of birth provided.', 400);
      }
      const today = new Date();
      calculatedAge = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        calculatedAge--;
      }
      if (calculatedAge < 18) {
        return error(res, 'You must be at least 18 years old to join Collage Story (PRD Section 4.1).', 400);
      }
    }

    // Execute atomic PostgreSQL database update
    const updatedUser = await prisma.$transaction(async (tx) => {
      // 1. User Model
      const userUpdate = {};
      if (displayName) userUpdate.displayName = displayName.trim();
      if (fullName) userUpdate.fullName = fullName.trim();
      if (birthDate) {
        userUpdate.dateOfBirth = birthDate;
        userUpdate.age = calculatedAge;
      } else if (calculatedAge !== undefined) {
        userUpdate.age = calculatedAge;
      }
      if (gender) userUpdate.gender = gender;

      if (Object.keys(userUpdate).length > 0) {
        await tx.user.update({
          where: { id: req.user.id },
          data: userUpdate,
        });
      }

      // 2. UserProfile Model
      const profileUpdate = {};
      if (bio !== undefined) profileUpdate.bio = bio.trim();
      if (interests !== undefined) profileUpdate.interests = interests;
      if (hobbies !== undefined) profileUpdate.hobbies = hobbies;
      if (languages !== undefined) profileUpdate.languages = languages;
      if (relationshipIntention !== undefined) profileUpdate.relationshipIntention = relationshipIntention;
      if (lookingFor !== undefined) profileUpdate.lookingFor = lookingFor;
      if (city !== undefined) profileUpdate.city = city.trim();
      if (state !== undefined) profileUpdate.state = state.trim();
      if (currentMood !== undefined) {
        const validatedMood = validateMood(currentMood);
        if (!validatedMood) {
          throw new Error(`Unsupported mood "${currentMood}".`);
        }
        profileUpdate.currentMood = validatedMood.label;
        profileUpdate.moodUpdatedAt = new Date();
      }

      if (Object.keys(profileUpdate).length > 0) {
        await tx.userProfile.upsert({
          where: { userId: req.user.id },
          update: profileUpdate,
          create: {
            userId: req.user.id,
            bio: bio || '',
            interests: interests || [],
            hobbies: hobbies || [],
            languages: languages || ['English'],
            relationshipIntention: relationshipIntention || 'Casual Connection',
            lookingFor: lookingFor || 'Friendship',
            city: city || 'Campus',
            state: state || 'State',
          },
        });
      }

      // 3. Education Model
      const eduUpdate = {};
      if (collegeName !== undefined) eduUpdate.collegeName = collegeName.trim();
      if (course !== undefined) eduUpdate.degreeName = course.trim();
      if (departmentStream !== undefined) eduUpdate.departmentStream = departmentStream.trim();
      if (academicYear !== undefined) eduUpdate.academicYear = academicYear.trim();

      if (Object.keys(eduUpdate).length > 0) {
        await tx.education.updateMany({
          where: { userId: req.user.id },
          data: eduUpdate,
        });
      }

      return tx.user.findUnique({
        where: { id: req.user.id },
        include: {
          profile: true,
          education: { include: { college: true } },
          photos: { orderBy: { photoOrder: 'asc' } },
        },
      });
    });

    if (currentMood) {
      socketService.broadcastMoodUpdate(req.user.id, currentMood);
    }

    const serialized = serializePrivateAccount(updatedUser);
    return success(res, { profile: serialized, user: serialized }, 'Profile updated successfully in database');
  } catch (err) {
    return error(res, `Profile update failed: ${err.message}`, 500);
  }
};

/**
 * POST /api/v1/profiles/photos
 * Uploads a new photo or replaces an existing photo for the authenticated student.
 */
export const uploadPhoto = async (req, res) => {
  try {
    const rawPhoto = req.file?.buffer || req.body?.photo || req.body?.photoUrl || req.body?.image;
    if (!rawPhoto) {
      return error(res, 'Please provide an image file or image data URL to upload.', 400);
    }

    // Determine target photo order and main status
    const existingPhotos = await prisma.userPhoto.findMany({
      where: { userId: req.user.id },
      orderBy: { photoOrder: 'asc' },
    });

    const replacePhotoId = req.body?.replacePhotoId || req.query?.replacePhotoId;
    let targetOrder = parseInt(req.body?.photoOrder || req.query?.photoOrder, 10);
    const isMainRequested = req.body?.isMain === true || req.body?.isMain === 'true' || targetOrder === 1;

    let existingToReplace = null;
    if (replacePhotoId) {
      existingToReplace = existingPhotos.find((p) => p.id === replacePhotoId);
      if (!existingToReplace) {
        return error(res, 'Photograph to replace was not found.', 404);
      }
      targetOrder = existingToReplace.photoOrder;
    } else if (isNaN(targetOrder)) {
      targetOrder = (existingPhotos[existingPhotos.length - 1]?.photoOrder || 0) + 1;
    }

    // Process image through Sharp: strips EXIF/GPS, converts to WebP, creates thumbnail & discovery variants
    const processed = await imageService.processAndSavePhoto(rawPhoto, targetOrder);

    let updatedPhotos;
    await prisma.$transaction(async (tx) => {
      if (isMainRequested) {
        await tx.userPhoto.updateMany({
          where: { userId: req.user.id },
          data: { isMain: false },
        });
      }

      if (existingToReplace) {
        await tx.userPhoto.update({
          where: { id: existingToReplace.id },
          data: {
            photoUrl: processed.fileName,
            isMain: isMainRequested || existingToReplace.isMain,
            isApproved: true,
          },
        });
        // Delete old physical photo files from disk after successful update
        imageService.deletePhotoFiles(existingToReplace.photoUrl).catch(() => {});
      } else {
        await tx.userPhoto.create({
          data: {
            userId: req.user.id,
            photoUrl: processed.fileName,
            photoOrder: targetOrder,
            isMain: isMainRequested || existingPhotos.length === 0,
            isApproved: true,
          },
        });
      }

      updatedPhotos = await tx.userPhoto.findMany({
        where: { userId: req.user.id },
        orderBy: { photoOrder: 'asc' },
      });
    });

    // Fetch full updated user record
    const fullUser = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        profile: true,
        education: { include: { college: true } },
        photos: { orderBy: { photoOrder: 'asc' } },
      },
    });

    const serialized = serializePrivateAccount(fullUser);
    return success(
      res,
      {
        user: serialized,
        profile: serialized,
        photo: {
          url: `/api/v1/photos/${processed.fileName}`,
          order: targetOrder,
          isMain: isMainRequested,
        },
        photos: serialized.photos,
      },
      'Photograph uploaded and saved successfully',
      201
    );
  } catch (err) {
    return error(res, `Photo upload failed: ${err.message}`, 400);
  }
};

/**
 * DELETE /api/v1/profiles/photos/:photoId
 * Removes an existing photograph for the authenticated student.
 */
export const deletePhoto = async (req, res) => {
  try {
    const { photoId } = req.params;
    const existing = await prisma.userPhoto.findFirst({
      where: { id: photoId, userId: req.user.id },
    });

    if (!existing) {
      return error(res, 'Photograph not found or unauthorized to delete.', 404);
    }

    const totalCount = await prisma.userPhoto.count({
      where: { userId: req.user.id },
    });

    if (totalCount <= 1) {
      return error(res, 'Cannot remove your only profile photograph. At least one photograph is required.', 400);
    }

    await prisma.$transaction(async (tx) => {
      await tx.userPhoto.delete({
        where: { id: photoId },
      });

      // If deleted photo was primary, assign primary status to next lowest order photo
      if (existing.isMain) {
        const nextMain = await tx.userPhoto.findFirst({
          where: { userId: req.user.id },
          orderBy: { photoOrder: 'asc' },
        });
        if (nextMain) {
          await tx.userPhoto.update({
            where: { id: nextMain.id },
            data: { isMain: true },
          });
        }
      }
    });

    // Clean up physical file from disk
    imageService.deletePhotoFiles(existing.photoUrl).catch(() => {});

    const fullUser = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        profile: true,
        education: { include: { college: true } },
        photos: { orderBy: { photoOrder: 'asc' } },
      },
    });

    const serialized = serializePrivateAccount(fullUser);
    return success(res, { user: serialized, profile: serialized, photos: serialized.photos }, 'Photograph removed successfully');
  } catch (err) {
    return error(res, `Failed to delete photograph: ${err.message}`, 500);
  }
};

/**
 * PATCH /api/v1/profiles/photos/:photoId/main
 * Sets a specific photo as primary avatar for the student.
 */
export const setMainPhoto = async (req, res) => {
  try {
    const { photoId } = req.params;
    const target = await prisma.userPhoto.findFirst({
      where: { id: photoId, userId: req.user.id },
    });

    if (!target) {
      return error(res, 'Photograph not found or unauthorized.', 404);
    }

    await prisma.$transaction(async (tx) => {
      await tx.userPhoto.updateMany({
        where: { userId: req.user.id },
        data: { isMain: false },
      });
      await tx.userPhoto.update({
        where: { id: photoId },
        data: { isMain: true },
      });
    });

    const fullUser = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        profile: true,
        education: { include: { college: true } },
        photos: { orderBy: { photoOrder: 'asc' } },
      },
    });

    const serialized = serializePrivateAccount(fullUser);
    return success(res, { user: serialized, profile: serialized, photos: serialized.photos }, 'Primary profile photograph updated');
  } catch (err) {
    return error(res, `Failed to update primary photo: ${err.message}`, 500);
  }
};

export default {
  getMyProfile,
  updateMyProfile,
  uploadPhoto,
  deletePhoto,
  setMainPhoto,
};
