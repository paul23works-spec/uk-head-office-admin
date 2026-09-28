import prisma from '@/lib/db';

export class ProjectService {
  static async getProjectById(projectId: string) {
    return prisma.project.findUnique({
      where: { id: projectId },
      include: {
        stages: true,
        boqs: true,
      },
    });
  }

  static async getAllProjects() {
    return prisma.project.findMany({
      include: {
        stages: true,
      },
    });
  }
}
