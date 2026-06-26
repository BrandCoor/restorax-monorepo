import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { StockService } from './stock.service';
import { CreateStockDto } from './dto/create-stock.dto';
import { UpdateStockDto } from './dto/update-stock.dto';

@Controller('stock')
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @Post()
  create(@Body() createStockDto: CreateStockDto) {
    return this.stockService.create(createStockDto);
  }

  @Get('low')
  findLowStock(@Query('branchId') branchId: string) {
    return this.stockService.findLowStock(branchId);
  }

  @Get('recipes/:productId')
  findRecipes(@Param('productId') productId: string) {
    return this.stockService.findRecipesByProduct(productId);
  }

  @Post('recipes')
  saveRecipe(
    @Body()
    body: { productId: string; stockId: string; consumedQuantity: number },
  ) {
    return this.stockService.saveRecipe(body);
  }

  @Delete('recipes/:id')
  removeRecipe(@Param('id') id: string) {
    return this.stockService.removeRecipe(id);
  }

  @Get()
  findAll(@Query('branchId') branchId?: string) {
    return this.stockService.findAll(branchId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.stockService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateStockDto: UpdateStockDto) {
    return this.stockService.update(id, updateStockDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.stockService.remove(id);
  }
}
