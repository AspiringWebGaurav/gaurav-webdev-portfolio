/**
 * Yup Validation Schemas
 * Centralized validation logic using Yup for consistent form validation
 */

import * as Yup from 'yup';
import {
  MIN_NAME_LENGTH,
  MAX_NAME_LENGTH,
  MIN_MESSAGE_LENGTH,
  MAX_MESSAGE_LENGTH,
} from '@/types/contactSubmission';

/**
 * Contact Form Validation Schema
 */
export const contactFormSchema = Yup.object().shape({
  name: Yup.string()
    .required('Name is required')
    .min(MIN_NAME_LENGTH, `Name must be at least ${MIN_NAME_LENGTH} characters`)
    .max(MAX_NAME_LENGTH, `Name must not exceed ${MAX_NAME_LENGTH} characters`)
    .matches(/^[a-zA-Z\s\-']+$/, 'Name should only contain letters, spaces, hyphens, and apostrophes')
    .test('has-vowel', 'Please enter a valid name', (value) => {
      if (!value) return false;
      return /[aeiouAEIOU]/.test(value);
    })
    .test('no-numbers', 'Name should not contain numbers', (value) => {
      if (!value) return true;
      return !/\d/.test(value);
    })
    .test('no-repeated-chars', 'Name contains invalid repeated characters', (value) => {
      if (!value) return true;
      return !/(.)\1{2,}/.test(value);
    })
    .test('no-keyboard-patterns', 'Please enter your real name', (value) => {
      if (!value) return true;
      const nameLower = value.toLowerCase().replace(/\s+/g, '');
      const keyboardPatterns = /qwert|asdf|zxcv|qaz|wsx|edc|rfv|tgb|yhn|ujm/i;
      return !keyboardPatterns.test(nameLower);
    })
    .test('no-repeated-sequences', 'Please enter a valid name without repeated patterns', (value) => {
      if (!value) return true;
      const nameLower = value.toLowerCase().replace(/\s+/g, '');
      
      // Check for repeated 2-4 character sequences (like "adads", "adad")
      for (let len = 2; len <= 4; len++) {
        const regex = new RegExp(`([a-z]{${len}})\\1{1,}`, 'i');
        if (regex.test(nameLower)) {
          return false;
        }
      }
      
      // Also check each word separately for short repeated patterns
      const words = value.split(/\s+/);
      for (const word of words) {
        const wordLower = word.toLowerCase();
        // Check if word is just 2-3 chars repeated (like "adad", "dadad")
        for (let len = 2; len <= 3; len++) {
          const pattern = new RegExp(`^([a-z]{${len}})\\1+$`, 'i');
          if (pattern.test(wordLower)) {
            return false;
          }
        }
      }
      
      return true;
    })
    .test('no-alternating-patterns', 'Please enter your real name', (value) => {
      if (!value) return true;
      const nameLower = value.toLowerCase().replace(/\s+/g, '');
      return !/^([a-z]{1,2})\1{3,}$/i.test(nameLower);
    })
    .test('no-excessive-consonants', 'Name contains invalid character combinations', (value) => {
      if (!value) return true;
      return !/[bcdfghjklmnpqrstvwxyz]{5,}/i.test(value);
    })
    .test('valid-vowel-ratio', 'Please enter a valid name', (value) => {
      if (!value) return true;
      
      const words = value.split(/\s+/);
      for (const word of words) {
        const wordLower = word.toLowerCase();
        const vowels = (wordLower.match(/[aeiou]/g) || []).length;
        const consonants = (wordLower.match(/[bcdfghjklmnpqrstvwxyz]/g) || []).length;
        
        // Check vowel to consonant ratio
        if (word.length >= 5 && consonants > 0 && vowels / consonants < 0.3) {
          return false;
        }
        
        // Check for words that are too simple/repetitive (like "adad", "dada")
        if (word.length >= 4) {
          // Count unique characters - real names have variety
          const uniqueChars = new Set(wordLower.split('')).size;
          // If word has 4+ chars but only 2-3 unique chars, it's suspicious
          if (uniqueChars <= 3 && word.length >= 4) {
            return false;
          }
        }
      }
      return true;
    }),

  email: Yup.string()
    .required('Email is required')
    .email('Please enter a valid email address')
    .test('no-temp-email', 'Temporary email addresses are not allowed', (value) => {
      if (!value) return true;
      const tempEmailPatterns = /tempmail|guerrillamail|throwaway|disposable|10minutemail|mailinator|trashmail/i;
      return !tempEmailPatterns.test(value);
    })
    .test('no-long-random', 'Please use a valid email address', (value) => {
      if (!value) return true;
      // Check for very long random strings before @
      const localPart = value.split('@')[0];
      return localPart.length <= 30;
    }),

  message: Yup.string()
    .required('Message is required')
    .min(MIN_MESSAGE_LENGTH, `Message must be at least ${MIN_MESSAGE_LENGTH} characters`)
    .max(MAX_MESSAGE_LENGTH, `Message must not exceed ${MAX_MESSAGE_LENGTH} characters`)
    .test('has-alpha', 'Message must contain valid text', (value) => {
      if (!value) return false;
      const cleanText = value.replace(/[\s.,!?;:()\-]/g, '');
      return /[a-zA-Z]/.test(cleanText) && cleanText.length >= 3;
    })
    .test('no-repeated-sequences', 'Message contains repeated patterns. Please write a meaningful message', (value) => {
      if (!value) return true;
      
      const words = value.split(/\s+/);
      for (const word of words) {
        const wordLower = word.toLowerCase();
        
        // Skip very short words
        if (wordLower.length < 4) continue;
        
        // Check for repeated 2-3 character sequences (like "asdasd", "dadada")
        for (let len = 2; len <= 3; len++) {
          const pattern = new RegExp(`([a-z]{${len}})\\1{1,}`, 'i');
          if (pattern.test(wordLower)) {
            return false;
          }
        }
        
        // Check for words with too few unique characters
        const uniqueChars = new Set(wordLower.split('')).size;
        if (uniqueChars <= 3 && wordLower.length >= 5) {
          return false;
        }
      }
      return true;
    })
    .test('no-keyboard-patterns', 'Please write a meaningful message', (value) => {
      if (!value) return true;
      const textLower = value.toLowerCase();
      const keyboardPatterns = /qwert|asdf|zxcv|qaz|wsx|edc|rfv|tgb|yhn|ujm/i;
      return !keyboardPatterns.test(textLower);
    })
    .test('no-excessive-repetition', 'Message contains too much repetition', (value) => {
      if (!value) return true;
      // Check for same character repeated many times
      if (/(.)\1{4,}/.test(value)) {
        return false;
      }
      return true;
    })
    .test('valid-word-ratio', 'Please write a more detailed message with real words', (value) => {
      if (!value) return true;
      
      const words = value.split(/\s+/).filter(w => w.length >= 3);
      if (words.length < 3) return true; // Too short to judge properly
      
      let validWords = 0;
      for (const word of words) {
        const wordLower = word.toLowerCase();
        const vowels = (wordLower.match(/[aeiou]/g) || []).length;
        const consonants = (wordLower.match(/[bcdfghjklmnpqrstvwxyz]/g) || []).length;
        const uniqueChars = new Set(wordLower.split('')).size;
        
        // A valid word should have:
        // - At least one vowel
        // - Decent character variety (unique chars >= 40% of word length)
        if (vowels >= 1 && uniqueChars >= Math.ceil(wordLower.length * 0.4)) {
          validWords++;
        }
      }
      
      // At least 60% of words should be valid
      const validRatio = validWords / words.length;
      return validRatio >= 0.6;
    }),
});

/**
 * Initial values for contact form
 */
export const contactFormInitialValues = {
  name: '',
  email: '',
  message: '',
};

/**
 * Type for contact form values
 */
export type ContactFormValues = typeof contactFormInitialValues;
