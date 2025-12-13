const { Member, Chore, Assignment, PointHistory } = require('../models');
const { validateMobileChange, sanitizeMobileData } = require('../utils/mobileValidation');

/**
 * Service for handling data sync between mobile SQLite and MongoDB
 */
class SyncService {
  /**
   * Get all family data for initial sync
   */
  static async getSyncData(familyId) {
    try {
      const [members, chores, assignments, pointHistories] = await Promise.all([
        Member.find({ family_id: familyId }).lean(),
        Chore.find({ family_id: familyId }).lean(),
        Assignment.find({ family_id: familyId })
          .populate('member_id chore_id')
          .lean(),
        PointHistory.find({ family_id: familyId }).lean()
      ]);

      return {
        members,
        chores,
        assignments,
        pointHistories,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Sync data retrieval failed: ${error.message}`);
    }
  }

  /**
   * Handle offline changes from mobile app
   * Apply changes to MongoDB and return updated data
   */
  static async applyOfflineChanges(familyId, changes) {
    try {
      const results = {
        applied: [],
        failed: [],
        updatedData: {}
      };

      for (const change of changes) {
        // Validate the change
        const validation = validateMobileChange(change);
        if (!validation.valid) {
          results.failed.push({
            type: change.type,
            error: validation.error,
            originalChange: change
          });
          continue;
        }

        try {
          // Sanitize the data
          const sanitizedData = sanitizeMobileData(change.data, change.type);

          let result;

          switch (change.type) {
            case 'create_member':
              result = await this.handleCreateMember(familyId, sanitizedData);
              break;
            case 'update_member':
              result = await this.handleUpdateMember(familyId, sanitizedData);
              break;
            case 'delete_member':
              result = await this.handleDeleteMember(familyId, sanitizedData.id || sanitizedData._id);
              break;
            case 'create_chore':
              result = await this.handleCreateChore(familyId, sanitizedData);
              break;
            case 'update_chore':
              result = await this.handleUpdateChore(familyId, sanitizedData);
              break;
            case 'delete_chore':
              result = await this.handleDeleteChore(familyId, sanitizedData.id || sanitizedData._id);
              break;
            case 'complete_assignment':
              result = await this.handleCompleteAssignment(familyId, sanitizedData);
              break;
            case 'update_points':
              result = await this.handleUpdatePoints(familyId, sanitizedData);
              break;
            default:
              throw new Error(`Unknown change type: ${change.type}`);
          }

          results.applied.push({
            type: change.type,
            id: result._id || result.id,
            originalChange: change
          });
        } catch (error) {
          results.failed.push({
            type: change.type,
            error: error.message,
            originalChange: change
          });
        }
      }

      // Return updated data after applying changes
      results.updatedData = await this.getSyncData(familyId);

      return results;
    } catch (error) {
      throw new Error(`Apply changes failed: ${error.message}`);
    }
  }

  /**
   * Handle member creation
   */
  static async handleCreateMember(familyId, memberData) {
    const member = new Member({
      ...memberData,
      family_id: familyId
    });
    return await member.save();
  }

  /**
   * Handle member update
   */
  static async handleUpdateMember(familyId, memberData) {
    return await Member.findOneAndUpdate(
      { _id: memberData._id, family_id: familyId },
      { ...memberData },
      { new: true, runValidators: true }
    );
  }

  /**
   * Handle member deletion
   */
  static async handleDeleteMember(familyId, memberId) {
    return await Member.findOneAndDelete({
      _id: memberId,
      family_id: familyId
    });
  }

  /**
   * Handle chore creation
   */
  static async handleCreateChore(familyId, choreData) {
    const chore = new Chore({
      ...choreData,
      family_id: familyId
    });
    return await chore.save();
  }

  /**
   * Handle chore update
   */
  static async handleUpdateChore(familyId, choreData) {
    return await Chore.findOneAndUpdate(
      { _id: choreData._id, family_id: familyId },
      { ...choreData },
      { new: true, runValidators: true }
    );
  }

  /**
   * Handle chore deletion
   */
  static async handleDeleteChore(familyId, choreId) {
    return await Chore.findOneAndDelete({
      _id: choreId,
      family_id: familyId
    });
  }

  /**
   * Handle assignment completion
   */
  static async handleCompleteAssignment(familyId, assignmentData) {
    // This would update an assignment record
    const { assignmentId, pointsEarned, completedAt } = assignmentData;
    
    // Find the assignment and update its status
    const assignment = await Assignment.findOneAndUpdate(
      { _id: assignmentId, family_id: familyId },
      { 
        completed: true,
        completed_at: completedAt || new Date(),
        points_earned: pointsEarned
      },
      { new: true }
    );

    if (assignment && assignment.member_id) {
      // Update member's total points
      await Member.findByIdAndUpdate(
        assignment.member_id,
        { $inc: { total_points: pointsEarned || 0 } },
        { new: true }
      );
    }

    return assignment;
  }

  /**
   * Handle points update
   */
  static async handleUpdatePoints(familyId, pointData) {
    const { memberId, pointsChange, reason } = pointData;
    
    // Update member's points
    const member = await Member.findOneAndUpdate(
      { _id: memberId, family_id: familyId },
      { $inc: { total_points: pointsChange } },
      { new: true }
    );

    // Create point history record
    const pointHistory = new PointHistory({
      member_id: memberId,
      amount: pointsChange,
      reason: reason || 'Manual adjustment',
      family_id: familyId
    });
    await pointHistory.save();

    return { member, pointHistory };
  }
}

module.exports = SyncService;