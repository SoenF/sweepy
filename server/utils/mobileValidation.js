/**
 * Mobile-specific validation utilities
 */

const isValidObjectId = require('mongoose').Types.ObjectId.isValid;

/**
 * Validates if a change object is valid for mobile sync
 */
function validateMobileChange(change) {
  if (!change.type || !change.data) {
    return { valid: false, error: 'Change must have type and data properties' };
  }

  switch (change.type) {
    case 'create_member':
      if (!change.data.name) {
        return { valid: false, error: 'Member name is required' };
      }
      return { valid: true };

    case 'update_member':
      if (!isValidObjectId(change.data._id || change.data.id)) {
        return { valid: false, error: 'Valid member ID is required' };
      }
      return { valid: true };

    case 'delete_member':
      if (!isValidObjectId(change.data.id)) {
        return { valid: false, error: 'Valid member ID is required' };
      }
      return { valid: true };

    case 'create_chore':
      if (!change.data.name || !change.data.frequency_value || !change.data.frequency_type) {
        return { valid: false, error: 'Chore name, frequency_value, and frequency_type are required' };
      }
      return { valid: true };

    case 'update_chore':
      if (!isValidObjectId(change.data._id || change.data.id)) {
        return { valid: false, error: 'Valid chore ID is required' };
      }
      return { valid: true };

    case 'delete_chore':
      if (!isValidObjectId(change.data.id)) {
        return { valid: false, error: 'Valid chore ID is required' };
      }
      return { valid: true };

    case 'complete_assignment':
      if (!isValidObjectId(change.data.assignmentId)) {
        return { valid: false, error: 'Valid assignment ID is required' };
      }
      return { valid: true };

    case 'update_points':
      if (!isValidObjectId(change.data.memberId)) {
        return { valid: false, error: 'Valid member ID is required' };
      }
      if (typeof change.data.pointsChange !== 'number') {
        return { valid: false, error: 'Points change must be a number' };
      }
      return { valid: true };

    default:
      return { valid: false, error: `Unknown change type: ${change.type}` };
  }
}

/**
 * Sanitizes mobile data to prevent malicious input
 */
function sanitizeMobileData(data, type) {
  if (!data) return null;

  switch (type) {
    case 'create_member':
    case 'update_member':
      return {
        name: typeof data.name === 'string' ? data.name.trim().substring(0, 100) : '',
        avatar: typeof data.avatar === 'string' ? data.avatar.substring(0, 200) : undefined,
        total_points: typeof data.total_points === 'number' ? data.total_points : undefined
      };

    case 'create_chore':
    case 'update_chore':
      return {
        name: typeof data.name === 'string' ? data.name.trim().substring(0, 100) : '',
        difficulty: typeof data.difficulty === 'number' ? Math.min(Math.max(data.difficulty, 1), 10) : 1,
        frequency_value: typeof data.frequency_value === 'number' ? data.frequency_value : 1,
        frequency_type: ['days', 'weeks', 'months'].includes(data.frequency_type) ? data.frequency_type : 'days',
        auto_assign: typeof data.auto_assign === 'boolean' ? data.auto_assign : true,
        assigned_members: Array.isArray(data.assigned_members) ? data.assigned_members.filter(isValidObjectId) : []
      };

    case 'update_points':
      return {
        memberId: isValidObjectId(data.memberId) ? data.memberId : null,
        pointsChange: typeof data.pointsChange === 'number' ? Math.round(data.pointsChange) : 0,
        reason: typeof data.reason === 'string' ? data.reason.trim().substring(0, 200) : 'Manual adjustment'
      };

    case 'complete_assignment':
      return {
        assignmentId: isValidObjectId(data.assignmentId) ? data.assignmentId : null,
        pointsEarned: typeof data.pointsEarned === 'number' ? Math.round(data.pointsEarned) : 0,
        completedAt: data.completedAt instanceof Date || typeof data.completedAt === 'string' ? new Date(data.completedAt) : new Date()
      };

    default:
      return data;
  }
}

module.exports = {
  validateMobileChange,
  sanitizeMobileData
};