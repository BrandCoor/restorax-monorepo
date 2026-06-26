import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsString()
  @IsNotEmpty({ message: 'Restoran adı boş bırakılamaz.' })
  restaurantName!: string;

  @IsString()
  @IsNotEmpty({ message: 'Subdomain boş bırakılamaz.' })
  subdomain!: string;

  @IsString()
  @IsNotEmpty({ message: 'Şube adı boş bırakılamaz.' })
  branchName!: string;

  @IsEmail({}, { message: 'Geçerli bir e-posta adresi giriniz.' })
  email!: string;

  @IsString()
  @MinLength(6, { message: 'Şifre en az 6 karakter olmalıdır.' })
  password!: string;

  @IsString()
  @IsNotEmpty({ message: 'Ad boş bırakılamaz.' })
  firstName!: string;

  @IsString()
  @IsNotEmpty({ message: 'Soyad boş bırakılamaz.' })
  lastName!: string;

  @IsString()
  @IsOptional()
  phone?: string;
}
