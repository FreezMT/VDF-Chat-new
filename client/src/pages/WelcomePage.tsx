import { Link } from 'react-router-dom'

export function WelcomePage() {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-app px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(2rem,env(safe-area-inset-top))]">
      <div className="flex flex-1 flex-col items-center justify-center px-1 text-center">
        <h1 className="max-w-[20rem] text-[26px] font-bold leading-tight tracking-tight text-white sm:text-[28px]">
          Добро пожаловать в VDF Chat
        </h1>
        <p className="mt-4 max-w-[18rem] text-[15px] leading-snug text-white/85">
          Здесь вы сможете общаться со своей командой
        </p>
      </div>

      <div className="mx-auto w-full max-w-md space-y-3 pb-2">
        <Link
          to="/register"
          className="flex h-14 w-full items-center justify-center rounded-full bg-accent text-[16px] font-semibold text-white shadow-md transition active:scale-[0.98] active:brightness-95"
        >
          Регистрация
        </Link>
        <Link
          to="/login"
          className="flex h-14 w-full items-center justify-center rounded-full bg-[#2a2a2a] text-[16px] font-semibold text-white transition active:scale-[0.98] active:bg-[#343434]"
        >
          Вход
        </Link>
      </div>
    </div>
  )
}
