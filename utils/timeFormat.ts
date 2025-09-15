/**
 * Formats a date/time string to 12-hour format with IST timezone
 * @param dateString - ISO date string or timestamp
 * @returns Formatted time string like "11:10 AM IST" or "12:21 PM IST"
 */
export function formatTimeIST(dateString: string | number): string {
  try {
    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Invalid time';
    }

    // Format to IST (Asia/Kolkata timezone) with 12-hour format
    const options: Intl.DateTimeFormatOptions = {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    };

    const timeString = date.toLocaleTimeString('en-US', options);
    
    // Add IST suffix and ensure proper formatting
    return `${timeString} IST`;
  } catch (error) {
    console.error('Error formatting time:', error);
    return 'Invalid time';
  }
}

/**
 * Formats a date to full date and time in IST
 * @param dateString - ISO date string or timestamp
 * @returns Formatted date-time string like "Jan 6, 2025 11:10 AM IST"
 */
export function formatDateTimeIST(dateString: string | number): string {
  try {
    const date = new Date(dateString);
    
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }

    const dateOptions: Intl.DateTimeFormatOptions = {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    };

    const dateTimeString = date.toLocaleString('en-US', dateOptions);
    
    return `${dateTimeString} IST`;
  } catch (error) {
    console.error('Error formatting date-time:', error);
    return 'Invalid date';
  }
}

/**
 * Formats duration in minutes to human readable format
 * @param minutes - Duration in minutes
 * @returns Formatted duration like "2h 30m" or "45m"
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return `${hours}h`;
  }
  
  return `${hours}h ${remainingMinutes}m`;
}