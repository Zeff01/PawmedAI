/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface GoogleCredentialResponse {
  credential: string
  select_by: string
}

interface GoogleAccountsId {
  initialize: (config: {
    client_id: string
    callback: (response: GoogleCredentialResponse) => void
    nonce?: string
    auto_select?: boolean
  }) => void
  renderButton: (
    parent: HTMLElement,
    options: {
      type?: 'standard' | 'icon'
      theme?: 'outline' | 'filled_blue' | 'filled_black'
      size?: 'large' | 'medium' | 'small'
      text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin'
      shape?: 'rectangular' | 'pill' | 'circle' | 'square'
      logo_alignment?: 'left' | 'center'
      width?: number
    },
  ) => void
  prompt: () => void
}

interface Window {
  google?: {
    accounts: {
      id: GoogleAccountsId
    }
  }
}
