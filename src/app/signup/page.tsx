
import Link from 'next/link'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SubmitButton } from '../login/submit-button'

export default function Signup({ searchParams }: { searchParams: { message: string } }) {
  const signUp = async (formData: FormData) => {
    'use server'

    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const username = formData.get('username') as string
    const supabase = createClient()
    const headersList = headers()
    const host = headersList.get('host')
    const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https'

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${protocol}://${host}/auth/callback`,
        data: {
          username: username,
        },
      },
    })

    if (error) {
      const errorMessage = encodeURIComponent('登録に失敗しました');
      return redirect(`/signup?message=${errorMessage}`)
    }

    const successMessage = encodeURIComponent('確認メールを送信しました。メールを確認してください。');
    return redirect(`/signup?message=${successMessage}`)
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col justify-center items-center">
      <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-white">新規登録</h1>
        <form className="space-y-6" action={signUp}>
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white" htmlFor="username">
              ユーザー名
            </label>
            <input
              className="w-full px-4 py-2 text-gray-900 bg-gray-50 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
              name="username"
              placeholder="あなたの名前"
              required
            />
          </div>
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white" htmlFor="email">
              メールアドレス
            </label>
            <input
              className="w-full px-4 py-2 text-gray-900 bg-gray-50 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
              name="email"
              placeholder="you@example.com"
              required
            />
          </div>
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white" htmlFor="password">
              パスワード
            </label>
            <input
              className="w-full px-4 py-2 text-gray-900 bg-gray-50 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
              type="password"
              name="password"
              placeholder="••••••••"
              required
            />
          </div>
          <SubmitButton
            className="w-full px-5 py-2.5 text-sm font-medium text-center text-white bg-blue-700 rounded-lg hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
            pendingText="登録中..."
          >
            登録する
          </SubmitButton>
          <p className="text-sm font-light text-center text-gray-500 dark:text-gray-400">
            すでにアカウントをお持ちですか？{' '}
            <Link href="/login" className="font-medium text-blue-600 hover:underline dark:text-blue-500">
              ログイン
            </Link>
          </p>
          {searchParams?.message && (
            <p className="mt-4 p-4 text-sm text-center text-red-800 bg-red-100 rounded-lg dark:bg-red-200 dark:text-red-800">
              {searchParams.message}
            </p>
          )}
        </form>
      </div>
    </div>
  )
}
