"""Serializers for user authentication and profile management."""
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

User = get_user_model()


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Extends JWT payload with user metadata to avoid a follow-up /me request."""

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["email"] = user.email
        token["full_name"] = user.full_name
        token["system_role"] = user.system_role
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        data["user"] = UserProfileSerializer(self.user).data
        return data


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True, min_length=8, validators=[validate_password]
    )
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ["email", "full_name", "password", "password_confirm"]

    def validate(self, attrs):
        if attrs["password"] != attrs.pop("password_confirm"):
            raise serializers.ValidationError({"password_confirm": "Passwords do not match."})
        return attrs

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


class UserProfileSerializer(serializers.ModelSerializer):
    """Full user profile — used in /me and token payloads."""

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "full_name",
            "avatar",
            "system_role",
            "job_title",
            "timezone",
            "is_active",
            "created_at",
        ]
        read_only_fields = ["id", "email", "system_role", "is_active", "created_at"]


class UserProfileUpdateSerializer(serializers.ModelSerializer):
    """Allows updating profile fields — email and role changes require separate endpoints."""

    class Meta:
        model = User
        fields = ["full_name", "avatar", "job_title", "timezone"]


class UserMinimalSerializer(serializers.ModelSerializer):
    """Compact representation for embedding in task/project serializers."""

    class Meta:
        model = User
        fields = ["id", "full_name", "email", "avatar", "system_role"]


class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=8, validators=[validate_password])
    new_password_confirm = serializers.CharField(write_only=True)

    def validate(self, attrs):
        if attrs["new_password"] != attrs["new_password_confirm"]:
            raise serializers.ValidationError(
                {"new_password_confirm": "Passwords do not match."}
            )
        return attrs

    def validate_current_password(self, value):
        user = self.context["request"].user
        if not user.check_password(value):
            raise serializers.ValidationError("Current password is incorrect.")
        return value
