
import React from 'react';

interface SubmissionTimeDisplayProps {
  submittedAt: Date | string;
  className?: string;
}

const SubmissionTimeDisplay: React.FC<SubmissionTimeDisplayProps> = ({ submittedAt, className = "" }) => {
  const formatSubmissionTime = (date: Date | string) => {
    const submissionDate = typeof date === 'string' ? new Date(date) : date;
    
    // Format to EST timezone
    const options: Intl.DateTimeFormatOptions = {
      timeZone: 'America/New_York',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    };
    
    const formattedDate = submissionDate.toLocaleString('en-US', options);
    return `${formattedDate} EST`;
  };

  return (
    <div className={className}>
      <div className="text-sm font-medium text-gray-900">
        {formatSubmissionTime(submittedAt)}
      </div>
    </div>
  );
};

export default SubmissionTimeDisplay;
