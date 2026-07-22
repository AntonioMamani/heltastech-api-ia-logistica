import { PartialType } from '@nestjs/mapped-types';
import { CreateIaAgenteDto } from './create-ia-agente.dto';

export class UpdateIaAgenteDto extends PartialType(CreateIaAgenteDto) {}
