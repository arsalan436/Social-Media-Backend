import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  createPost(@Body() createPostDto: CreatePostDto, @Request() req) {
    const userId = req.user.userId;
    return this.postsService.create(createPostDto, userId);
  }
}
