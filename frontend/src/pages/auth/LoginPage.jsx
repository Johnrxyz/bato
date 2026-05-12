import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useUIStore } from '@/store/uiStore'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import styles from './AuthPage.module.css'

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

export default function LoginPage() {
  const login = useAuthStore((s) => s.login)
  const toast = useUIStore((s) => s.toast)
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm({ resolver: zodResolver(schema) })

  const onSubmit = async (data) => {
    try {
      await login(data)
      navigate('/dashboard')
    } catch (err) {
      const detail = err.response?.data?.detail
      if (detail) {
        setError('root', { message: 'Invalid email or password.' })
      } else {
        toast.error('Something went wrong. Please try again.')
      }
    }
  }

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h2 className={styles.title}>Sign in</h2>
        <p className={styles.subtitle}>Continue to your workspace</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className={styles.form}>
        {errors.root && (
          <div className={styles.formError} role="alert">
            {errors.root.message}
          </div>
        )}

        <Input
          label="Email"
          type="email"
          id="email"
          autoComplete="email"
          required
          error={errors.email?.message}
          {...register('email')}
        />

        <Input
          label="Password"
          type="password"
          id="password"
          autoComplete="current-password"
          required
          error={errors.password?.message}
          {...register('password')}
        />

        <Button
          type="submit"
          size="lg"
          loading={isSubmitting}
          style={{ width: '100%', marginTop: 'var(--space-2)' }}
        >
          Sign in
        </Button>
      </form>

      <p className={styles.footer}>
        Don&apos;t have an account?{' '}
        <Link to="/register">Create one</Link>
      </p>
    </div>
  )
}
