from rest_framework.pagination import PageNumberPagination


class MedicalLogPagination(PageNumberPagination):
    page_size = 8
    page_size_query_param = "page_size"
    max_page_size = 200
