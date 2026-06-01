import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function ResetPassword() {

  const navigate = useNavigate()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleResetPassword(
    e: React.FormEvent
  ) {

    e.preventDefault()

    setError('')
    setSuccess('')

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.updateUser({
      password: password,
    })

    if (error) {
      setError(error.message)
    } else {

      setSuccess('Password updated successfully')

      setTimeout(() => {
        navigate('/login')
      }, 2000)
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-4">

      <form
        onSubmit={handleResetPassword}
        className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-lg"
      >

        <h1 className="mb-6 text-2xl font-bold text-white">
          Reset Password
        </h1>

        <div className="mb-4">
          <input
            type="password"
            placeholder="New Password"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
            className="w-full rounded-lg border border-white/10 bg-black/40 p-3 text-white outline-none"
          />
        </div>

        <div className="mb-4">
          <input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) =>
              setConfirmPassword(e.target.value)
            }
            className="w-full rounded-lg border border-white/10 bg-black/40 p-3 text-white outline-none"
          />
        </div>

        {error && (
          <p className="mb-4 text-red-400">
            {error}
          </p>
        )}

        {success && (
          <p className="mb-4 text-green-400">
            {success}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-indigo-600 p-3 font-semibold text-white transition hover:bg-indigo-500"
        >
          {
            loading
              ? 'Updating...'
              : 'Update Password'
          }
        </button>

      </form>

    </div>
  )
}