import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
} from 'firebase/auth'
import { firebaseAuth } from '@/lib/firebase'

let confirmationResult: ConfirmationResult | null = null

// Step 1: Send OTP
export async function sendOTP(phoneNumber: string): Promise<void> {
  // Format phone number to E.164: +923001234567
  const formatted = phoneNumber
    .replace(/\s/g, '')
    .replace(/^0/, '+92')
    .replace(/^\+?92/, '+92')

  // Setup invisible reCAPTCHA (required by Firebase)
  const recaptcha = new RecaptchaVerifier(firebaseAuth, 'recaptcha-container', {
    size: 'invisible',
    callback: () => {},
  })

  confirmationResult = await signInWithPhoneNumber(
    firebaseAuth, formatted, recaptcha
  )
}

// Step 2: Verify OTP
export async function verifyOTP(code: string): Promise<string> {
  if (!confirmationResult) throw new Error('No OTP sent')
  const result = await confirmationResult.confirm(code)
  const idToken = await result.user.getIdToken()
  return idToken  // send this to your backend
}
