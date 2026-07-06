from rest_framework import serializers
from django.contrib.auth import get_user_model

Merchant = get_user_model()

class MerchantSerializer(serializers.ModelSerializer):
    class Meta:
        model = Merchant
        fields = ['id', 'username', 'email', 'business_name', 'phone', 'created_at']
        read_only_fields = ['id', 'created_at']

class MerchantRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = Merchant
        fields = ['username', 'email', 'password', 'business_name', 'phone']

    def create(self, validated_data):
        user = Merchant.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            business_name=validated_data['business_name'],
            phone=validated_data.get('phone', '')
        )
        return user
