export type TelegramLoginData = {
  "telegram_id": number,
  "username": string,
  "telegram_username": string,
  "first_name": string,
  "last_name"?: string,
  "photo_url": string,
  "auth_date": number,
  "hash": string,
}

export type TelegramLoginProps = {
  callBack: (data: TelegramLoginData) => void
}
