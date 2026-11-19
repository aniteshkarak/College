/**
 * Calculate review deadline: strictly 72 hours from submission
 */
export const calculateReviewDeadline = (submittedAt = new Date()) => {
  const date = new Date(submittedAt);
  date.setHours(date.getHours() + 72);
  return date.toISOString();
};

/**
 * Check if application is overdue (>72 hours) and calculate remaining/overdue hours
 */
export const getOverdueStatus = (deadlineIso, status) => {
  if (!deadlineIso) return { isOverdue: false, diffHours: 0, label: 'N/A' };

  if (['APPROVED', 'REJECTED'].includes(status)) {
    return { isOverdue: false, diffHours: 0, label: 'Completed' };
  }

  const deadline = new Date(deadlineIso);
  const now = new Date();
  const diffMs = deadline - now;
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));

  if (diffMs < 0) {
    const overdueHours = Math.abs(diffHours);
    return {
      isOverdue: true,
      diffHours: overdueHours,
      label: `Overdue by ${overdueHours}h`
    };
  }

  return {
    isOverdue: false,
    diffHours,
    label: `${diffHours}h remaining`
  };
};

/**
 * Strict server-side age calculation from date of birth (DOB)
 */
export const calculateAge = (dobString) => {
  if (!dobString) return 0;
  const birthDate = new Date(dobString);
  if (isNaN(birthDate.getTime())) return 0;

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
};

/**
 * Validate that applicant is strictly 18+ under Indian DPDP Act
 */
export const isEligible18Plus = (dobString) => {
  return calculateAge(dobString) >= 18;
};
