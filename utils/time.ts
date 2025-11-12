
/**
 * Formats a time string "HH:MM" into a more readable format, e.g., "7:00 PM".
 * @param timeString - The time string in "HH:MM" format.
 * @returns A formatted time string.
 */
export const formatTime = (timeString: string): string => {
    const [hour, minute] = timeString.split(':');
    const hourNum = parseInt(hour, 10);
    const ampm = hourNum >= 12 ? 'PM' : 'AM';
    const formattedHour = hourNum % 12 === 0 ? 12 : hourNum % 12;
    return `${formattedHour}:${minute} ${ampm}`;
};

/**
 * Gets the lowercase day of the week (e.g., "monday") from a Date object.
 * @param date - The Date object.
 * @returns The name of the day.
 */
export const getDayOfWeek = (date: Date): string => {
    return date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
};
