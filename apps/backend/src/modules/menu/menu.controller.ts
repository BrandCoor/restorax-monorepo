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
import { MenuService } from './menu.service';
import { Public } from '../auth/decorators/public.decorator';

@Controller('menu')
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  @Post('categories')
  createCategory(
    @Body()
    body: {
      branchId: string;
      name: string;
      imageUrl?: string;
      isActive?: boolean;
    },
  ) {
    return this.menuService.createCategory(body);
  }

  @Patch('categories/:id')
  updateCategory(
    @Param('id') id: string,
    @Body() body: { name?: string; imageUrl?: string; isActive?: boolean },
  ) {
    return this.menuService.updateCategory(id, body);
  }

  @Delete('categories/:id')
  removeCategory(@Param('id') id: string) {
    return this.menuService.removeCategory(id);
  }

  @Post('products')
  createProduct(
    @Body()
    body: {
      categoryId: string;
      name: string;
      description?: string;
      price: number;
      imageUrl?: string;
      estimatedPrepareTime?: number;
      isActive?: boolean;
    },
  ) {
    return this.menuService.createProduct(body);
  }

  @Patch('products/:id')
  updateProduct(
    @Param('id') id: string,
    @Body()
    body: {
      name?: string;
      description?: string;
      price?: number;
      imageUrl?: string;
      estimatedPrepareTime?: number;
      isActive?: boolean;
      categoryId?: string;
    },
  ) {
    return this.menuService.updateProduct(id, body);
  }

  @Delete('products/:id')
  removeProduct(@Param('id') id: string) {
    return this.menuService.removeProduct(id);
  }

  @Public()
  @Get()
  findAll(@Query('branchId') branchId?: string, @Query('admin') admin?: string) {
    if (branchId && admin === 'true') {
      return this.menuService.findAllByBranchAdmin(branchId);
    }
    if (branchId) {
      return this.menuService.findAllByBranch(branchId);
    }
    return this.menuService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.menuService.findOne(id);
  }
}
