import { IsString, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class GetPerpPriceQueryDto {
  @IsString()
  @IsNotEmpty({ message: 'Asset parameter is required' })
  asset: string;

  @IsString()
  @IsOptional()
  tzOffset?: string;
}

export class PerpPriceResponseDto {
  @IsNumber()
  price: number;

  @IsNumber()
  timestamp: number;
}

export class PerpPriceDto {
  @IsString()
  @IsNotEmpty()
  aaAddress: string;

  @IsNumber()
  @Type(() => Number)
  mci: number;

  @IsString()
  @IsNotEmpty()
  asset: string;

  @IsOptional()
  notForUse: number;

  @IsNumber()
  @Type(() => Number)
  price: number;

  @IsNumber()
  @Type(() => Number)
  priceFromResponse: number;

  @IsNumber()
  @Type(() => Number)
  timestamp: number;
}
