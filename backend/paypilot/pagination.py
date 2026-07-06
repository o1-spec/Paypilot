from rest_framework.pagination import PageNumberPagination

class OptionalPageNumberPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100
    
    def paginate_queryset(self, queryset, request, view=None):
        # Only activate pagination if the 'page' query param is explicitly requested
        if 'page' not in request.query_params:
            return None
        return super().paginate_queryset(queryset, request, view)
