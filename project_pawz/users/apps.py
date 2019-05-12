from django.apps import AppConfig


class UsersAppConfig(AppConfig):

    name = "project_pawz.users"
    verbose_name = "Users"

    def ready(self):
        try:
            import project_pawz.users.signals  # noqa F401
        except ImportError:
            pass
